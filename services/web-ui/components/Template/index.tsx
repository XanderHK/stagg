import Head from 'next/head'
import styled from 'styled-components'
import Main from './Main'
import Nav from './Nav'
import Footer from './Footer'

const Container = styled.div`
    background: url(/assets/img/bg.jpg) no-repeat center center fixed; 
    background-color: #0d121a;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
    height: 100%;

    hr {
        border-width: 1px;
        border-color: rgba(255, 255, 255, 0.07);
        display: block;
        margin: 0 auto;
        padding: 0 !important;
    }
`

const Overlay = styled.div`
    background: rgba(0, 0, 0, 0.5);
    height: 100%;
`

export default ({ children }) => {
    return (
        <Container>
            <Head>
                <link rel="stylesheet" href="/assets/css/base.css" media="all" />
                <link rel="stylesheet" href="/assets/css/icomoon.css" media="all" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,700%7COpen+Sans:300,400,700&amp;subset=latin,latin,latin" media="all" />
            </Head>
            <Overlay>
                <Nav />
                <Main>
                    { children }
                </Main>
                <Footer />
            </Overlay>
        </Container>
    )
}
