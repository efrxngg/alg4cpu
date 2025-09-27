import {Component} from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChartModule} from 'primeng/chart';
import {ComparisonChartComponent} from './comparison-chart.component';
import {MetricsResult} from './metrics-result';

// Define las interfaces y clases para los procesos y métricas
interface Process {
  arrivalTime: number; // El id es el tiempo de llegada
  name: string;
  burstTime: number;
  priority: number;
  startTime?: number;
  endTime?: number;
  availableDuration?: number;
}

interface GanttEvent {
  id: number;
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
}


// Genera un color aleatorio para el diagrama de Gantt
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    ChartModule,
    ComparisonChartComponent,
  ],
  templateUrl: './app.component.html',
  styles: [],
})
export class App {
  // Estado de la aplicación
  processes: Process[] = [];
  messages: any[] = [];
  metrics: MetricsResult[] = [];
  ganttChart: GanttEvent[] = [];

  newProcessName = '';
  newProcessDuration = 0;
  newProcessPriority = 0;
  randomProcessesCount = 5;

  selectedAlgorithm = '';
  simulationFinished = false;
  quantumValue = 10; // Valor por defecto del quantum

  // Getter para calcular el tiempo total de la simulación
  isEnableCompareAll = false;

  get totalTime(): number {
    return this.ganttChart.reduce((sum, event) => sum + (event.endTime - event.startTime), 0);
  }

  // Agrega un nuevo proceso a la lista
  addProcess() {
    if (this.newProcessName && this.newProcessDuration) {
      const newProcess: Process = {
        arrivalTime: this.processes.length,
        name: this.newProcessName,
        burstTime: this.newProcessDuration,
        priority: this.newProcessPriority || 0,
      };
      this.processes = [...this.processes, newProcess];
      this.newProcessName = '';
      this.newProcessDuration = 0;
      this.newProcessPriority = 0;
    }
  }

  // Genera procesos aleatorios y los añade a la lista
  generateRandomProcesses() {
    if (this.randomProcessesCount > 0) {
      for (let i = 0; i < this.randomProcessesCount; i++) {
        const randomDuration = Math.floor(Math.random() * 50) + 1; // Duración entre 1 y 50
        const randomPriority = Math.floor(Math.random() * 10) + 1; // Prioridad entre 1 y 10
        const idx = this.processes.length;
        const newProcess: Process = {
          arrivalTime: idx,
          name: `P${idx}`,
          burstTime: randomDuration,
          priority: randomPriority
        };
        this.processes = [...this.processes, newProcess];
      }
    }

    // this.runSimulation()
    if (this.isEnableCompareAll) {
      this.compareAll();
    }
  }

  // Remueve un proceso de la lista
  removeProcess(index: number) {
    this.processes = this.processes.filter((_, i) => i !== index);
  }

  // Limpia la salida de la simulación
  clearSimulationOutput() {
    this.ganttChart = [];
    this.messages = [];
    this.metrics = [];
    this.simulationFinished = false;
    this.isEnableCompareAll = false
  }

  // Elimina todos los procesos y limpia la simulación
  killAllProcesses() {
    this.selectedAlgorithm = '';
    this.processes = [];
    this.clearSimulationOutput();
  }

  // Función auxiliar para ordenar los procesos según el algoritmo
  private sortProcesses(algorithm: string, processes: Process[]): Process[] {
    const processesCopy = [...processes];
    switch (algorithm) {
      case 'SJF':
        return processesCopy.sort((a, b) => a.burstTime - b.burstTime);
      case 'Priority':
        return processesCopy.sort((a, b) => a.priority - b.priority);
      case 'SJF_Priority':
        return processesCopy.sort((a, b) => {
          // Si tienen prioridades diferentes evalua por priridad
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Si son iguales evalua por duracion
          return a.burstTime - b.burstTime;
        });
      case 'FCFS':
      case 'RR':
      default:
        return processesCopy;
    }
  }

  // Simula la ejecución de una cola de procesos y genera los datos de Gantt
  private simulateQueue(queue: Process[]) {
    const auxQueue: Process[] = [...queue];
    let currentTime = 0;
    const currentGantt: GanttEvent[] = [];

    while (auxQueue.length > 0) {
      const currentProcess = auxQueue.shift()!;

      const startTime = currentTime;
      currentProcess.startTime = currentTime;
      currentTime = currentTime + currentProcess.burstTime
      currentProcess.endTime = currentTime;
      const lastEndTime = currentTime;

      this.addProcessToGanttQueue(currentGantt, currentProcess, startTime, lastEndTime);
    }

    return currentGantt;
  }

  private simulateQueueRR(queue: Process[], quantun: number) {
    const auxQueue: Process[] = [...queue];
    auxQueue.forEach((p) => p.availableDuration = p.burstTime);

    let currentTime = 0;
    const currentGantt: GanttEvent[] = [];

    while (auxQueue.length > 0) {
      const currentProcess = auxQueue.shift()!;
      // Si el tiempo de inicio no existe lo setea
      console.log(currentProcess);
      currentProcess.startTime ||= currentTime;

      const startTime = currentTime;
      let avalibleDuration = currentProcess.availableDuration! - quantun;

      if (avalibleDuration <= 0) {
        currentTime += currentProcess.availableDuration!;
        currentProcess.availableDuration = avalibleDuration;
        currentProcess.endTime = currentTime;
      } else {
        currentTime += quantun;
        currentProcess.availableDuration = avalibleDuration;
        auxQueue.push(currentProcess);
      }

      const endTime = currentTime;

      this.addProcessToGanttQueue(currentGantt, currentProcess, startTime, endTime);
    }

    return currentGantt;
  }

  private addProcessToGanttQueue(currentGantt: GanttEvent[], currentProcess: Process, startTime: number, endTime: number) {
    const color = currentGantt
      .find(cgp => cgp.id === currentProcess.arrivalTime)?.color || getRandomColor();

    currentGantt.push({
      id: currentProcess.arrivalTime,
      processName: currentProcess.name,
      startTime,
      endTime,
      color,
    });
  }

// Calcula las métricas de rendimiento y actualiza el estado
  private calculateMetricsRR(algorithm: string, processes: Process[]) {
    let avgTurnaroundTime = 0, avgWaitTime = 0, avgResponseTime = 0;

    processes.forEach(p => {
      // Tiempo de retorno (TAT) = Tiempo de finalización - Tiempo de llegada
      const turnaroundTime = p.endTime! - p.arrivalTime;
      // Tiempo de espera = TAT - Burst Time
      const waitTime = turnaroundTime - p.burstTime;
      // Tiempo de respuesta = CPU First Time - Arrival Time
      const responseTime = p.startTime! - p.arrivalTime;

      avgTurnaroundTime += turnaroundTime
      avgWaitTime += waitTime;
      avgResponseTime += responseTime;
    });

    avgTurnaroundTime /= processes.length;
    avgWaitTime /= processes.length;
    avgResponseTime /= processes.length;

    this.messages = [...this.messages, {
      severity: 'success',
      summary: `Simulación ${algorithm} quantum ${this.quantumValue} finalizada.`
    }];
    console.log({algorithm, avgTurnaroundTime, avgWaitTime, pLength: processes.length});
    return {algorithm, avgTurnaroundTime, avgWaitTime, avgResponseTime} as MetricsResult;
  }

  // Calcula las métricas de rendimiento y actualiza el estado
  private calculateMetrics(algorithm: string, processes: Process[]) {
    let avgTurnaroundTime = 0, avgWaitTime = 0, avgResponseTime = 0;

    processes.forEach(p => {
      // Tiempo promedio de respuesta
      avgTurnaroundTime += p.endTime!;
      // Tiempo promedio de espera
      avgWaitTime += p.startTime!;
      // Tiempo de respuesta = CPU First Time - Arrival Time
      avgResponseTime += p.startTime! - p.arrivalTime;
    });

    avgTurnaroundTime /= processes.length;
    avgWaitTime /= processes.length;

    this.messages = [...this.messages, {severity: 'success', summary: `Simulación ${algorithm} finalizada.`}];
    console.log({algorithm, avgExecutionTime: avgTurnaroundTime, avgWaitTime, pLength: processes.length});
    return {algorithm, avgTurnaroundTime, avgWaitTime, avgResponseTime} as MetricsResult;
  }

  // Ejecuta la simulación completa para un algoritmo dado
  private runAlgorithm(algorithm: string, quantum?: number) {
    // Llama a una función auxiliar para obtener la cola ordenada
    const queue = this.sortProcesses(algorithm, this.processes);
    let metricsResult: MetricsResult;
    // Simula la ejecución y obtiene los resultados
    if (algorithm === 'RR') {
      this.ganttChart = this.simulateQueueRR(queue, quantum!);
      metricsResult = this.calculateMetricsRR(algorithm, queue);
    } else {
      this.ganttChart = this.simulateQueue(queue);
      metricsResult = this.calculateMetrics(algorithm, queue);
    }

    console.log({metricsResult});
    // Calcula las métricas y actualiza el estado
    this.metrics = [...this.metrics, metricsResult];
  }

  // Ejecuta la simulación completa con el algoritmo seleccionado
  runSimulation() {
    this.clearSimulationOutput();
    if (this.selectedAlgorithm) {
      if (this.selectedAlgorithm === 'RR') {
        if (this.quantumValue <= 0) {
          this.messages = [...this.messages, {
            severity: 'error',
            summary: 'Error de Simulación',
            detail: 'El valor de quantum no puede ser menor o igual a 0.'
          }];
          return;
        }
        this.runAlgorithm(this.selectedAlgorithm, this.quantumValue);
      } else {
        this.runAlgorithm(this.selectedAlgorithm);
      }
      this.simulationFinished = true;
    }
  }

  // Compara todos los algoritmos
  compareAll() {
    console.log('[compareAll]')
    this.clearSimulationOutput();
    if (this.quantumValue <= 0) {
      this.messages = [...this.messages, {
        severity: 'error',
        summary: 'Error de Simulación',
        detail: 'El valor de quantum no puede ser menor o igual a 0.'
      }];
      return;
    }
    this.messages = [...this.messages, {severity: 'info', summary: 'Comparando todos los algoritmos.'}];
    this.isEnableCompareAll = true
    this.selectedAlgorithm = '';
    this.runAlgorithm('FCFS');
    this.runAlgorithm('SJF');
    this.runAlgorithm('Priority');
    this.runAlgorithm('RR', this.quantumValue);
    this.runAlgorithm('SJF_Priority');
    this.simulationFinished = true;
  }
}
