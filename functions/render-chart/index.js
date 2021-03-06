const path = require('path');

const RedisStore = require('rate-limit-redis');
const express = require('express');
const javascriptStringify = require('javascript-stringify').stringify;
const qs = require('qs');
const rateLimit = require('express-rate-limit');
const text2png = require('text2png');

const packageJson = require('./package.json');
const telemetry = require('./telemetry');
const { getPdfBufferFromPng, getPdfBufferWithText } = require('./lib/pdf');
const { logger } = require('./logging');
const { renderChartJs } = require('./lib/charts');
const { renderGraphviz } = require('./lib/graphviz');
const { toChartJs, parseSize } = require('./lib/google_image_charts');
const { renderQr, DEFAULT_QR_SIZE } = require('./lib/qr');

const app = express();

const isDev = app.get('env') === 'development' || app.get('env') === 'test';

app.set('query parser', str =>
  qs.parse(str, {
    decode(s) {
      // Default express implementation replaces '+' with space. We don't want
      // that. See https://github.com/expressjs/express/issues/3453
      return decodeURIComponent(s);
    },
  }),
);

app.use(
  express.json({
    limit: process.env.EXPRESS_JSON_LIMIT || '100kb',
  }),
);

app.use(express.urlencoded());

if (process.env.RATE_LIMIT_PER_MIN) {
  const limitMax = parseInt(process.env.RATE_LIMIT_PER_MIN, 10);
  logger.info('Enabling rate limit:', limitMax);

  let store = undefined;
  if (process.env.REDIS_URL) {
    logger.info(`Connecting to redis: ${process.env.REDIS_URL}`);
    store = new RedisStore({
      redisURL: process.env.REDIS_URL,
    });
  }

  const limiter = rateLimit({
    store,
    windowMs: 60 * 1000,
    max: limitMax,
    message:
      'Please slow down your requests! This is a shared public endpoint. Email support@quickchart.io or go to https://quickchart.io/pricing for rate limit exceptions or to purchase a commercial license.',
    onLimitReached: req => {
      logger.info('User hit rate limit!', req.ip);
    },
    keyGenerator: req => {
      return req.headers['x-forwarded-for'] || req.ip;
    },
  });
  app.use('/chart', limiter);
}

app.get('/', (req, res) => {
  res.status(418).send({ teapot: true });
});
app.get('/health', (req, res) => {
  res.send('ok');
});

app.post('/telemetry', (req, res) => {
  const chartCount = parseInt(req.body.chartCount, 10);
  const qrCount = parseInt(req.body.qrCount, 10);
  const pid = req.body.pid;

  if (chartCount && !isNaN(chartCount)) {
    telemetry.receive(pid, 'chartCount', chartCount);
  }
  if (qrCount && !isNaN(qrCount)) {
    telemetry.receive(pid, 'qrCount', qrCount);
  }

  res.send({ success: true });
});

function failPng(res, msg, statusCode = 500) {
  res.writeHead(statusCode, {
    'Content-Type': 'image/png',
  });
  res.end(
    text2png(`Chart Error: ${msg}`, {
      padding: 10,
      backgroundColor: '#fff',
    }),
  );
}

function failSvg(res, msg, statusCode = 500) {
  res.writeHead(statusCode, {
    'Content-Type': 'image/svg+xml',
  });
  res.end(`
<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <style>
    p {
      font-size: 8px;
    }
  </style>
  <foreignObject width="240" height="80"
   requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
    <p xmlns="http://www.w3.org/1999/xhtml">${msg}</p>
  </foreignObject>
</svg>`);
}

async function failPdf(res, msg) {
  const buf = await getPdfBufferWithText(msg);
  res.writeHead(500, {
    'Content-Type': 'application/pdf',
  });
  res.end(buf);
}

function renderChartToImage(req, res, opts) {
  opts.failFn = failPng;
  opts.onRenderHandler = buf => {
    res
      .type('png')
      .set({
        // 1 week cache
        'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
      })
      .send(buf)
      .end();
  };
  doChartjsRender(req, res, opts);
}

async function renderChartToPdf(req, res, opts) {
  opts.failFn = failPdf;
  opts.onRenderHandler = async buf => {
    const pdfBuf = await getPdfBufferFromPng(buf);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuf.length,

      // 1 week cache
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
    });
    res.end(pdfBuf);
  };
  doChartjsRender(req, res, opts);
}

function doChartjsRender(req, res, opts) {
  if (!opts.chart) {
    opts.failFn(res, 'You are missing variable `c` or `chart`');
    return;
  }

  const width = parseInt(opts.width, 10) || 500;
  const height = parseInt(opts.height, 10) || 300;

  let untrustedInput = opts.chart;
  if (opts.encoding === 'base64') {
    // TODO(ian): Move this decoding up the call stack.
    try {
      untrustedInput = Buffer.from(opts.chart, 'base64').toString('utf8');
    } catch (err) {
      logger.warn('base64 malformed', err);
      opts.failFn(res, err);
      return;
    }
  }

  renderChartJs(width, height, opts.backgroundColor, opts.devicePixelRatio, untrustedInput)
    .then(opts.onRenderHandler)
    .catch(err => {
      logger.warn('Chart error', err);
      opts.failFn(res, err);
    });
}

async function handleGraphviz(req, res, graphVizDef, opts) {
  try {
    const buf = await renderGraphviz(req.query.chl, opts);
    res
      .status(200)
      .type(opts.format === 'png' ? 'image/png' : 'image/svg+xml')
      .end(buf);
  } catch (err) {
    if (opts.format === 'png') {
      failPng(res, `Graph Error: ${err}`);
    } else {
      failSvg(res, `Graph Error: ${err}`);
    }
  }
}

function handleGChart(req, res) {
  // TODO(ian): Move these special cases into Google Image Charts-specific
  // handler.
  if (req.query.cht.startsWith('gv')) {
    // Graphviz chart
    const format = req.query.chof;
    const engine = req.query.cht.indexOf(':') > -1 ? req.query.cht.split(':')[1] : 'dot';
    const opts = {
      format,
      engine,
    };
    if (req.query.chs) {
      const size = parseSize(req.query.chs);
      opts.width = size.width;
      opts.height = size.height;
    }
    handleGraphviz(req, res, req.query.chl, opts);
    return;
  } else if (req.query.cht === 'qr') {
    const size = parseInt(req.query.chs.split('x')[0], 10);
    const qrData = req.query.chl;
    const chldVals = (req.query.chld || '').split('|');
    const ecLevel = chldVals[0] || 'L';
    const margin = chldVals[1] || 4;
    const qrOpts = {
      margin: margin,
      width: size,
      errorCorrectionLevel: ecLevel,
    };

    const format = 'png';
    const encoding = 'UTF-8';
    renderQr(format, encoding, qrData, qrOpts)
      .then(buf => {
        res.writeHead(200, {
          'Content-Type': format === 'png' ? 'image/png' : 'image/svg+xml',
          'Content-Length': buf.length,

          // 1 week cache
          'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
        });
        res.end(buf);
      })
      .catch(err => {
        failPng(res, err);
      });

    telemetry.count('qrCount');
    return;
  }

  let converted;
  try {
    converted = toChartJs(req.query);
  } catch (err) {
    logger.error(`GChart error: Could not interpret ${req.originalUrl}`);
    res.status(500).end('Sorry, this chart configuration is not supported right now');
    return;
  }

  if (req.query.format === 'chartjs-config') {
    // Chart.js config
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(javascriptStringify(converted.chart, undefined, 2));
    return;
  }

  renderChartJs(
    converted.width,
    converted.height,
    converted.backgroundColor,
    undefined,
    converted.chart,
  ).then(buf => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buf.length,

      // 1 week cache
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
    });
    res.end(buf);
  });
  telemetry.count('chartCount');
}

exports.default = (req, res) => {
  if (req.query.cht) {
    // This is a Google Image Charts-compatible request.
    handleGChart(req, res);
    return;
  }

  const opts = {
    chart: req.query.c || req.query.chart,
    height: req.query.h || req.query.height,
    width: req.query.w || req.query.width,
    backgroundColor: req.query.backgroundColor || req.query.bkg,
    devicePixelRatio: req.query.devicePixelRatio,
    encoding: req.query.encoding || 'url',
  };

  const outputFormat = (req.query.f || req.query.format || '').toLowerCase();

  if (outputFormat === 'pdf') {
    renderChartToPdf(req, res, opts);
  } else if (!outputFormat || outputFormat === 'png') {
    renderChartToImage(req, res, opts);
  } else {
    logger.error(`Request for unsupported format ${outputFormat}`);
    res.status(500).end(`Unsupported format ${outputFormat}`);
  }

  telemetry.count('chartCount');
}
