import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Chart = ({ data = [] }) => {
  // Preparar dados para o gráfico (últimos 20 pontos)
  const chartData = data.slice(0, 20).reverse();
  
  const chartConfig = {
    labels: chartData.map((_, index) => {
      const time = new Date(Date.now() - (chartData.length - index - 1) * 2000);
      return time.toLocaleTimeString('pt-PT', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }),
    datasets: [
      {
        label: 'Potenciômetro',
        data: chartData.map(item => item.potenciometro),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Histórico do Potenciômetro',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
        scales: {
          y: {
            beginAtZero: true,
            max: 4095, // ESP32 ADC resolution (0-4095)
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: '#6b7280',
              stepSize: 500, // Mostrar marcas a cada 500
            }
          },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 8,
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={chartConfig} options={options} />
    </div>
  );
};

export default Chart;

