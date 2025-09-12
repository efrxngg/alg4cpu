import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

// Define las interfaces y clases para los procesos y métricas
interface Process {
  id: number;
  name: string;
  duration: number;
  priority: number;
  arrivalTime: number;
  initialDuration: number;
}

interface GanttEvent {
  processName: string;
  start: number;
  end: number;
  color: string;
}

interface Metrics {
  algorithm: string;
  avgWaitTime: number;
  avgTurnaroundTime: number;
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
  ],
  template: `
    <div class="bg-gray-100 min-h-screen p-8 font-sans">
      <div class="container mx-auto max-w-7xl">
        <h1 class="text-4xl font-extrabold text-center mb-10 text-gray-800">Simulador de Planificación de CPU</h1>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Panel de Ingreso de Procesos -->
          <div class="lg:col-span-1 bg-white shadow-lg rounded-xl overflow-hidden">
            <div class="p-6">
              <h2 class="text-xl font-bold mb-4">Ingreso de Procesos</h2>
              <div class="space-y-4">
                <div class="relative">
                  <input id="processName" type="text" [(ngModel)]="newProcessName" placeholder="Nombre del Proceso"
                         class="w-full p-2 border rounded-md">
                </div>
                <div class="relative">
                  <input id="duration" type="number" [(ngModel)]="newProcessDuration" placeholder="Duración (ms)"
                         class="w-full p-2 border rounded-md">
                </div>
                <div class="relative">
                  <input id="priority" type="number" [(ngModel)]="newProcessPriority" placeholder="Prioridad"
                         class="w-full p-2 border rounded-md">
                </div>
                <button (click)="addProcess()" [disabled]="!newProcessName || !newProcessDuration"
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                  Agregar Proceso
                </button>
              </div>

              <div class="mt-6 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duración
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
                  <tr *ngFor="let process of processes(); let rowIndex = index">
                    <td class="px-6 py-4 whitespace-nowrap">{{ process.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ process.duration }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ process.priority }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button (click)="removeProcess(rowIndex)" class="text-red-600 hover:text-red-900 font-medium">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <button (click)="resetSimulation()"
                      class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg w-full mt-6 transition-colors">
                Reiniciar Simulación
              </button>
            </div>
          </div>

          <!-- Panel de Simulación y Métricas -->
          <div class="lg:col-span-2 space-y-8">
            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Control de Simulación y Algoritmos</h2>
              <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div class="flex-grow">
                  <label for="algorithm" class="block mb-2 font-semibold">Seleccionar Algoritmo:</label>
                  <select id="algorithm" [(ngModel)]="selectedAlgorithm" class="w-full p-2 border rounded-md">
                    <option value="FCFS">First-Come, First-Served (FCFS)</option>
                    <option value="SJF">Shortest Job First (SJF)</option>
                  </select>
                </div>
                <div class="flex-grow">
                  <label for="step" class="block mb-2 font-semibold">Paso a Paso:</label>
                  <button (click)="nextStep()" [disabled]="simulationFinished()"
                          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                    Siguiente Paso
                  </button>
                </div>
                <div class="flex-grow">
                  <label for="run" class="block mb-2 font-semibold">Ejecutar Completo:</label>
                  <button (click)="runSimulation()" [disabled]="simulationFinished()"
                          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                    Ejecutar
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Diagrama de Gantt</h2>
              <div class="flex h-12 border-b-2 border-gray-400 relative">
                <ng-container *ngFor="let event of ganttChart(); let i = index">
                  <div
                    [style.left.%]="(event.start / totalTime()) * 100"
                    [style.width.%]="((event.end - event.start) / totalTime()) * 100"
                    [style.backgroundColor]="event.color"
                    class="absolute h-12 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out"
                    [class.rounded-l-lg]="i === 0"
                    [class.rounded-r-lg]="i === ganttChart().length - 1"
                  >
                    {{ event.processName }}
                  </div>
                  <div class="absolute -bottom-6 text-xs text-gray-600"
                       [style.left.%]="(event.start / totalTime()) * 100">
                    {{ event.start }}
                  </div>
                </ng-container>
                <div class="absolute -bottom-6 text-xs text-gray-600" [style.left.%]="100">
                  {{ totalTime() }}
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
                  <tr *ngFor="let metric of metrics()">
                    <td class="px-6 py-4 whitespace-nowrap">{{ metric.algorithm }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ metric.avgWaitTime | number:'1.2-2' }} ms</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ metric.avgTurnaroundTime | number:'1.2-2' }} ms</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ metric.cpuUtilization | percent:'1.2-2' }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-white shadow-lg rounded-xl overflow-hidden p-6">
              <h2 class="text-xl font-bold mb-4">Logs de Simulación</h2>
              <div class="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <div *ngFor="let msg of messages()" class="mb-2 p-2 rounded-md" [ngClass]="{
                  'bg-blue-100 text-blue-800': msg.severity === 'info',
                  'bg-green-100 text-green-800': msg.severity === 'success'
                }">
                  <p class="font-semibold">{{ msg.summary }}</p>
                  <p class="text-sm" *ngIf="msg.detail">{{ msg.detail }}</p>
                </div>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Estado de la aplicación usando señales
  processes = signal<Process[]>([]);
  messages = signal<any[]>([]); // Cambiado a 'any' para evitar errores de tipo con 'severity'
  metrics = signal<Metrics[]>([]);
  ganttChart = signal<GanttEvent[]>([]);

  newProcessName = '';
  newProcessDuration = 0;
  newProcessPriority = 0;

  selectedAlgorithm = 'FCFS';
  simulationFinished = signal(false);
  simulationStep = signal(0);
  private simulationState: {
    queue: Process[];
    currentTime: number;
    gantt: GanttEvent[];
    logs: any[];
  } | null = null;
  private processedProcesses: {
    process: Process;
    completionTime: number;
    waitTime: number;
    turnaroundTime: number;
  }[] = [];

  // Señal computada para calcular el tiempo total de la simulación
  totalTime = computed(() => {
    return this.ganttChart().reduce((sum, event) => sum + (event.end - event.start), 0);
  });

  // Agrega un nuevo proceso a la lista
  addProcess() {
    if (this.newProcessName && this.newProcessDuration) {
      const newProcess: Process = {
        id: this.processes().length,
        name: this.newProcessName,
        duration: this.newProcessDuration,
        priority: this.newProcessPriority || 0,
        arrivalTime: 0, // Simplificación: todos llegan al mismo tiempo
        initialDuration: this.newProcessDuration,
      };
      this.processes.update(procs => [...procs, newProcess]);
      this.newProcessName = '';
      this.newProcessDuration = 0;
      this.newProcessPriority = 0;
    }
  }

  // Remueve un proceso de la lista
  removeProcess(index: number) {
    this.processes.update(procs => procs.filter((_, i) => i !== index));
  }

  // Reinicia la simulación
  resetSimulation() {
    this.ganttChart.set([]);
    this.messages.set([]);
    this.metrics.set([]);
    this.simulationFinished.set(false);
    this.simulationStep.set(0);
    this.simulationState = null;
    this.processedProcesses = [];
  }

  // Inicia la simulación en un estado inicial
  private initializeSimulation() {
    this.resetSimulation();
    const processesCopy = [...this.processes()];
    this.simulationState = {
      queue: [],
      currentTime: 0,
      gantt: [],
      logs: [],
    };
    if (this.selectedAlgorithm === 'FCFS') {
      this.simulationState.queue = processesCopy;
      this.simulationState.logs.push({severity: 'info', summary: 'Simulación FCFS iniciada.'});
    } else if (this.selectedAlgorithm === 'SJF') {
      // Ordena por duración para SJF
      this.simulationState.queue = processesCopy.sort((a, b) => a.duration - b.duration);
      this.simulationState.logs.push({severity: 'info', summary: 'Simulación SJF iniciada.'});
    }
    this.messages.set(this.simulationState.logs);
  }

  // Ejecuta un solo paso de la simulación
  nextStep() {
    if (!this.simulationState) {
      this.initializeSimulation();
    }

    if (this.simulationState!.queue.length > 0) {
      const currentProcess = this.simulationState!.queue.shift();
      const startTime = this.simulationState!.currentTime;
      const endTime = startTime + currentProcess!.duration;
      this.simulationState!.currentTime = endTime;

      const completionTime = endTime;
      const turnaroundTime = completionTime - currentProcess!.arrivalTime;
      const waitTime = turnaroundTime - currentProcess!.initialDuration;

      this.processedProcesses.push({
        process: currentProcess!,
        completionTime,
        waitTime,
        turnaroundTime
      });

      this.simulationState!.gantt.push({
        processName: currentProcess!.name,
        start: startTime,
        end: endTime,
        color: getRandomColor(),
      });
      this.ganttChart.set(this.simulationState!.gantt);
      this.simulationState!.logs.push({
        severity: 'success',
        summary: `Proceso '${currentProcess!.name}' finalizado.`,
        detail: `Inicio: ${startTime}, Fin: ${endTime}`
      });
      this.messages.set(this.simulationState!.logs);
      this.simulationStep.update(step => step + 1);

      if (this.simulationState!.queue.length === 0) {
        this.finishSimulation();
      }
    } else {
      this.finishSimulation();
    }
  }

  // Ejecuta la simulación completa
  runSimulation() {
    this.initializeSimulation();
    while (this.simulationState!.queue.length > 0) {
      this.nextStep();
    }
  }

  // Finaliza la simulación y calcula las métricas
  private finishSimulation() {
    this.simulationFinished.set(true);
    this.messages.update(msgs => [...msgs, {severity: 'success', summary: 'Simulación finalizada.'}]);

    // Calcula métricas
    const totalProcesses = this.processedProcesses.length;
    const totalWaitTime = this.processedProcesses.reduce((sum, p) => sum + p.waitTime, 0);
    const totalTurnaroundTime = this.processedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalCpuTime = this.processes().reduce((sum, p) => sum + p.duration, 0);

    const avgWaitTime = totalWaitTime / totalProcesses;
    const avgTurnaroundTime = totalTurnaroundTime / totalProcesses;
    const cpuUtilization = totalCpuTime / this.simulationState!.currentTime;

    this.metrics.update(m => [...m, {
      algorithm: this.selectedAlgorithm,
      avgWaitTime: avgWaitTime,
      avgTurnaroundTime: avgTurnaroundTime,
      cpuUtilization: cpuUtilization,
    }]);
  }
}
