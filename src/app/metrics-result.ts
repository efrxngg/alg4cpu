export interface MetricsResult {
  algorithm: string;
  avgWaitTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number; // como se calcula
}
