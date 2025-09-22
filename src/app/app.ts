import {Component} from '@angular/core';
import {CommonModule, DecimalPipe, PercentPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';

// Define las interfaces y clases para los procesos y métricas
interface Process {
  id: number; // El id es el tiempo de llegada
  name: string;
  duration: number;
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

interface MetricsResult {
  algorithm: string;
  avgWaitTime: number;
  avgExecutionTime: number;
  cpuUtilization: number;
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
    PercentPipe
  ],
  template: `
    <div class="bg-gray-100 min-h-screen p-8 font-sans">
      <div class="container mx-auto max-w-7xl">
        <h1 class="text-4xl font-extrabold text-left mb-10 text-gray-800">Alg4CPU</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Panel de Ingreso de Procesos -->
          <div class="lg:col-span-1 bg-white shadow-lg rounded-xl overflow-hidden">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold">Ingreso de Procesos</h2>
                <!-- Contenedor para la generación de procesos aleatorios -->
                <div class="flex items-center gap-2">
                  <input type="number" [(ngModel)]="randomProcessesCount" placeholder="Cantidad"
                         class="w-24 p-2 border rounded-md">
                  <button (click)="generateRandomProcesses()"
                          class="bg-black text-white hover:bg-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">
                    Generar
                  </button>
                </div>
              </div>

              <div class="mt-6 overflow-x-hidden overflow-y-auto max-h-[26rem]">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración
                      (ms)
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (process of processes; track process.id) {
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">{{ process.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">{{ process.duration }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">{{ process.priority }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <button (click)="removeProcess($index)" class="text-red-600 hover:text-red-900 font-medium">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  <!-- Nueva fila para agregar procesos, estilo Notion -->
                  <tr>
                    <td class="px-6 py-4">
                      <input type="text" [(ngModel)]="newProcessName" placeholder="Nombre del Proceso"
                             class="w-full p-1 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" [(ngModel)]="newProcessDuration" placeholder="0"
                             class="w-full p-1 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" [(ngModel)]="newProcessPriority" placeholder="0"
                             class="w-full p-1 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button (click)="addProcess()" [disabled]="!newProcessName || !newProcessDuration"
                              class="bg-transparent hover:bg-black/25 text-black hover:text-white font-bold py-1 px-3 rounded-lg w-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20"
                             fill="currentColor">
                          <path fill-rule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <button (click)="killAllProcesses()"
                      class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg w-full mt-6 transition-colors">
                Terminar Procesos
              </button>
            </div>
          </div>

          <!-- Panel de Simulación y Métricas -->
          <div class="lg:col-span-1 space-y-8">
            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Control de Simulación y Algoritmos</h2>
              <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <!-- Control de Selección de Algoritmo -->
                <div class="flex-grow">
                  <label for="algorithm" class="block mb-2 font-semibold">Seleccionar Algoritmo:</label>
                  <select id="algorithm" [(ngModel)]="selectedAlgorithm" (ngModelChange)="runSimulation()"
                          [disabled]="processes.length === 0" class="w-full p-2 border rounded-md">
                    <option value="">Seleccionar Algoritmo</option>
                    <option value="FCFS">First-Come, First-Served (FCFS)</option>
                    <option value="SJF">Shortest Job First (SJF)</option>
                    <option value="Priority">Prioridad</option>
                    <option value="SJF_Priority">SJF con Prioridad</option>
                    <option value="RR">Round Robin</option>
                  </select>
                </div>
                <!-- Campo de entrada para el quantum, solo visible para Round Robin -->
                @if (selectedAlgorithm === 'RR') {
                  <div class="flex-grow">
                    <label for="quantum" class="block mb-2 font-semibold text-center">Quantum:</label>
                    <input id="quantum" type="number" [(ngModel)]="quantumValue" (ngModelChange)="runSimulation()"
                           class="w-full p-2 border rounded-md">
                  </div>
                }
                <!-- Control de Comparación de Todos los Algoritmos -->
                <div class="flex-grow">
                  <label for="compare" class="block mb-2 font-semibold text-center">Comparar:</label>
                  <button (click)="compareAll()" [disabled]="processes.length === 0"
                          class="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                    Todos
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Diagrama de Gantt</h2>
              <div class="flex h-12 border-b-2 border-gray-400 relative">
                @for (event of ganttChart; track event.startTime) {
                  <div
                    [style.left.%]="(event.startTime / totalTime) * 100"
                    [style.width.%]="((event.endTime - event.startTime) / totalTime) * 100"
                    [style.backgroundColor]="event.color"
                    class="absolute h-12 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out"
                    [class.rounded-l-lg]="$index === 0"
                    [class.rounded-r-lg]="$index === ganttChart.length - 1"
                  >
                    {{ event.processName }}
                  </div>
                  <div class="absolute -bottom-6 text-xs text-gray-600"
                       [style.left.%]="(event.startTime / totalTime) * 100">
                    {{ event.startTime }}
                  </div>
                }
                <div class="absolute -bottom-6 text-xs text-gray-600" [style.left.%]="100">
                  {{ totalTime }}
                </div>
              </div>
            </div>

            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Métricas de Rendimiento</h2>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Algoritmo
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo de
                      Espera Promedio
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo de
                      Retorno Promedio
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uso de
                      CPU
                    </th>
                  </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (metric of metrics; track metric.algorithm) {
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap">{{ metric.algorithm }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">{{ metric.avgWaitTime | number:'1.2-2' }} ms</td>
                        <td class="px-6 py-4 whitespace-nowrap">{{ metric.avgExecutionTime | number:'1.2-2' }} ms</td>
                        <td class="px-6 py-4 whitespace-nowrap">{{ metric.cpuUtilization | percent:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Logs de Simulación</h2>
              <div class="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                @for (msg of messages; track msg.summary) {
                  <div class="mb-2 p-2 rounded-md" [ngClass]="{
                    'bg-blue-100 text-blue-800': msg.severity === 'info',
                    'bg-green-100 text-green-800': msg.severity === 'success',
                    'bg-red-100 text-red-800': msg.severity === 'error'
                  }">
                    <p class="font-semibold">{{ msg.summary }}</p>
                    @if (msg.detail) {
                      <p class="text-sm">{{ msg.detail }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card .p-card-header {
        padding: 1.5rem;
        background-color: #f3f4f6;
        border-bottom: 1px solid #e5e7eb;
      }

      .p-card .p-card-title {
        font-weight: 700;
        color: #1f2937;
      }

      .p-button {
        transition: all 0.2s ease-in-out;
        border-radius: 0.75rem;
      }

      .p-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .p-inputtext, .p-dropdown {
        border-radius: 0.75rem;
      }

      .p-datatable-header, .p-datatable-thead > tr > th {
        background-color: #e5e7eb !important;
      }
    }
  `],
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
  get totalTime(): number {
    return this.ganttChart.reduce((sum, event) => sum + (event.endTime - event.startTime), 0);
  }

  // Agrega un nuevo proceso a la lista
  addProcess() {
    if (this.newProcessName && this.newProcessDuration) {
      const newProcess: Process = {
        id: this.processes.length,
        name: this.newProcessName,
        duration: this.newProcessDuration,
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
        const newProcess: Process = {
          id: i,
          name: `P${i}`,
          duration: randomDuration,
          priority: randomPriority
        };
        this.processes = [...this.processes, newProcess];
      }
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
        return processesCopy.sort((a, b) => a.duration - b.duration);
      case 'Priority':
        return processesCopy.sort((a, b) => a.priority - b.priority);
      case 'SJF_Priority':
        return processesCopy.sort((a, b) => {
          // Si tienen prioridades diferentes evalua por priridad
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Si son iguales evalua por duracion
          return a.duration - b.duration;
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
      currentTime = currentTime + currentProcess.duration
      currentProcess.endTime = currentTime;
      const lastEndTime = currentTime;

      this.addProcessToGanttQueue(currentGantt, currentProcess, startTime, lastEndTime);
    }

    return currentGantt;
  }

  private simulateQueueRR(queue: Process[], quantun: number) {
    const auxQueue: Process[] = [...queue];
    auxQueue.forEach((p) => p.availableDuration = p.duration);

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
      .find(cgp => cgp.id === currentProcess.id)?.color || getRandomColor();

    currentGantt.push({
      id: currentProcess.id,
      processName: currentProcess.name,
      startTime,
      endTime,
      color,
    });
  }

// Calcula las métricas de rendimiento y actualiza el estado
  private calculateMetrics(algorithm: string, process: Process[]) {
    let avgExecutionTime = 0, avgWaitTime = 0;

    process.forEach(p => {
      // Tiempo promedio de respuesta: T = Fin - t_llegada
      const responseTime = p.endTime! - p.id;
      // Tiempo promedio de espera: E = T - t_ejecucion
      const waitTime = responseTime - p.duration;

      avgExecutionTime += responseTime
      avgWaitTime += waitTime;
    });

    avgExecutionTime /= process.length;
    avgWaitTime /= process.length;

    this.messages = [...this.messages, {severity: 'success', summary: `Simulación ${algorithm} finalizada.`}];
    console.log({algorithm, avgExecutionTime, avgWaitTime, pLength: process.length});
    return {algorithm, avgExecutionTime, avgWaitTime} as MetricsResult
  }

  // Ejecuta la simulación completa para un algoritmo dado
  private runAlgorithm(algorithm: string, quantum?: number) {
    // Llama a una función auxiliar para obtener la cola ordenada
    const queue = this.sortProcesses(algorithm, this.processes);
    // Simula la ejecución y obtiene los resultados
    if (algorithm === 'RR') {
      this.ganttChart = this.simulateQueueRR(queue, quantum!);
    } else {
      this.ganttChart = this.simulateQueue(queue);
    }

    // Calcula las métricas y actualiza el estado
    this.metrics = [this.calculateMetrics(algorithm, queue)];
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
    this.runAlgorithm('FCFS');
    this.runAlgorithm('SJF');
    this.runAlgorithm('Priority');
    this.runAlgorithm('SJF_Priority');
    this.runAlgorithm('RR', this.quantumValue);
    this.simulationFinished = true;
  }
}
