import {Component, Input, OnInit} from '@angular/core';
import {ChartModule} from 'primeng/chart';
import {MetricsResult} from './metrics-result';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [ChartModule],
  template: `
    <p-chart type="bar" [data]="chartData" [options]="chartOptions"></p-chart>
  `
})
export class ComparisonChartComponent implements OnInit {
  chartData: any;
  chartOptions: any;

  @Input() metrics: MetricsResult[] = [];

  constructor() {
  }

  ngOnInit() {
    console.log('metrics: ', this.metrics)

    const labels = this.metrics.map(m => m.algorithm);
    const espera = this.metrics.map(m => m.avgWaitTime);
    const retorno = this.metrics.map(m => m.avgTurnaroundTime);
    const respuesta = this.metrics.map(m => m.avgResponseTime);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Tiempo de Espera Promedio (ms)',
          data: espera,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderWidth: 1
        },
        {
          label: 'Tiempo de Retorno Promedio (ms)',
          data: retorno,
          backgroundColor: 'rgba(255, 206, 86, 0.7)',
          borderWidth: 1
        },
        {
          label: 'Tiempo de Respuesta Promedio (ms)',
          data: respuesta,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderWidth: 1
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {position: 'top'},
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${context.raw} ms`
          }
        }
      },
      scales: {
        x: {
          title: {display: true, text: 'Algoritmo'}
        },
        y: {
          title: {display: true, text: 'Tiempo (ms)'},
          beginAtZero: true
        }
      }
    };
  }

}
