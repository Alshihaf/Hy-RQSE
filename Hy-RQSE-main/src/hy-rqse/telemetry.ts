/**
 * Anonymous Telemetry Module for Hy-RQSE
 */

export interface TelemetryEvent {
  timestamp: number;
  dimension: number;
  operation: 'encrypt' | 'decrypt';
  durationMs: number;
  dataSize: number;
  success: boolean;
  error?: string;
}

export class TelemetryCollector {
  private static instance: TelemetryCollector;
  private events: TelemetryEvent[] = [];
  private enabled: boolean = true;

  private constructor() {}

  static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  record(event: Omit<TelemetryEvent, 'timestamp'>): void {
    if (!this.enabled) return;

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    
    // In a real scenario, we might batch and send to an endpoint
    // console.log(`[Telemetry] Recorded ${event.operation} - ${event.durationMs.toFixed(2)}ms`);

    // Keep memory bounded
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  getSummary() {
    if (this.events.length === 0) return null;

    const encryptEvents = this.events.filter(e => e.operation === 'encrypt');
    const decryptEvents = this.events.filter(e => e.operation === 'decrypt');

    const avgDuration = (evs: TelemetryEvent[]) => 
      evs.length > 0 ? evs.reduce((acc, e) => acc + e.durationMs, 0) / evs.length : 0;

    const failureCount = this.events.filter(e => !e.success).length;

    return {
      totalOperations: this.events.length,
      encryptAvgMs: avgDuration(encryptEvents),
      decryptAvgMs: avgDuration(decryptEvents),
      failures: failureCount,
      lastDimension: this.events[this.events.length - 1]?.dimension
    };
  }

  clear(): void {
    this.events = [];
  }
}

export const telemetry = TelemetryCollector.getInstance();
