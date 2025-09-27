import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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
export class ComparisonChartComponent implements OnInit, OnChanges {
  chartData: any;
  chartOptions: any;

  @Input() metrics: MetricsResult[] = [];

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[ngOnChanges]', changes);
    this.ngOnInit();
  }

  ngOnInit() {
    console.log('[ngOnInit]');

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
          backgroundColor: 'rgb(2,2,2)',
          borderWidth: 1
        },
        {
          label: 'Tiempo de Retorno Promedio (ms)',
          data: retorno,
          backgroundColor: 'rgb(154,162,176)',
          borderWidth: 1
        },
        {
          label: 'Tiempo de Respuesta Promedio (ms)',
          data: respuesta,
          backgroundColor: 'rgb(170,170,170)',
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
