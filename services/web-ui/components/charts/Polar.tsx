import { Polar } from 'react-chartjs-2'

const options = { maintainAspectRatio: false, legend: { display: false }, tooltips: { enabled: true } }
export default ({ groups }) => {
  const data = {
    labels: Object.keys(groups),
    datasets: [{
      label: '',
      data: Object.values(groups),
      backgroundColor: [
        '#4BC0C0',
        '#FFCE56',
        '#E7E9ED',
        '#36A2EB',
        '#FF6384',
      ]
    }]
  }
  return <Polar options={options} data={data} />
}