/**
 * OS Simulation Engine
 * Visualizes the 6 layers of Hy-RQSE OS in action
 */

import { ReservoirState } from './reservoir/state.ts';
import { blake3 } from '@noble/hashes/blake3.js';
import { hkdf } from '@noble/hashes/hkdf.js';

export class HyRQSEOSEngine {
  private kernelState: ReservoirState | null = null;
  private idealState: Float64Array | null = null;
  private n = 1024;
  private encoder = new TextEncoder();

  // L2: Process fingerprints
  private activePID: number = 0;
  private processW: Float64Array | null = null;

  // L3: Execution Control
  private vpc = 0x1000;
  private basicBlocks = [0x1000, 0x1A2F, 0x2B44, 0x3C88, 0x4D11];

  // L5: Anomaly Predictor
  private lastPrediction: number = 0;
  private anomalyThreshold = 0.5;

  async init(seed: Uint8Array) {
    const { initializeReservoir } = await import('./reservoir/init.ts');
    this.kernelState = await initializeReservoir(seed, this.n);
    this.idealState = new Float64Array(this.kernelState.s);
    
    // L2 Fingerprint derivation
    this.deriveProcessFingerprint(0, seed);
  }

  /**
   * Expand a 32-byte seed into requested number of bytes.
   */
  private expand(seed: Uint8Array, length: number): Uint8Array {
    const result = new Uint8Array(length);
    let offset = 0;
    let counter = 0;
    while (offset < length) {
      const chunk = blake3(new Uint8Array([...seed, ...this.encoder.encode(counter.toString())]));
      const toCopy = Math.min(chunk.length, length - offset);
      result.set(chunk.slice(0, toCopy), offset);
      offset += toCopy;
      counter++;
    }
    return result;
  }

  private deriveProcessFingerprint(pid: number, masterSeed: Uint8Array) {
    const pidBytes = this.encoder.encode(pid.toString());
    const salt = this.encoder.encode("W_PROC_SALT");
    // Generate a 32-byte seed first to avoid HKDF length limits
    const seed = hkdf(blake3, masterSeed, salt, pidBytes, 32); 
    const expanded = this.expand(seed, this.n * 8);
    this.processW = new Float64Array(expanded.buffer, expanded.byteOffset, this.n);
  }

  private performSelfHealing() {
    if (!this.kernelState || !this.idealState) return;

    let deviation = 0;
    for (let i = 0; i < 64; i++) {
      deviation += Math.abs(this.kernelState.s[i] - this.idealState[i]);
    }

    if (deviation > 0.8) {
      for (let steps = 0; steps < 64; steps++) {
        for (let j = 0; j < this.n; j++) {
          this.kernelState.s[j] = this.kernelState.s[j] * 0.9 + this.idealState[j] * 0.1;
        }
      }
    }
  }

  private performHybridKDF(): Uint8Array {
    if (!this.kernelState) return new Uint8Array(32);
    const pqSecret = new Uint8Array(128).fill(0xAA);
    const chaosEntropy = new Uint8Array(this.kernelState.s.buffer).slice(0, 64);
    return hkdf(blake3, pqSecret, chaosEntropy, "HYBRID_PQ_CHAOS", 32);
  }

  private checkAnomalies(actual: number) {
    const error = Math.abs(actual - this.lastPrediction);
    this.lastPrediction = this.lastPrediction * 0.7 + actual * 0.3;
    return error > this.anomalyThreshold;
  }

  async executeCycle() {
    if (!this.kernelState) return;

    // L3: Execution Path Obfuscation
    const jumpWeight = this.kernelState.s[0] * 1000;
    const nextIndex = Math.abs(Math.floor(jumpWeight)) % this.basicBlocks.length;
    this.vpc = this.basicBlocks[nextIndex];

    const workEntropy = this.vpc ^ Math.floor(Math.random() * 255);
    this.kernelState.update(workEntropy);
    this.checkAnomalies(this.kernelState.s[0]);

    this.performSelfHealing();

    if (Math.random() < 0.02) {
      this.performHybridKDF();
    }
  }

  getMetrics() {
    return {
      entropy: this.kernelState ? Math.abs(this.kernelState.s[0]) : 0,
      vpc: this.vpc.toString(16).toUpperCase(),
      activePID: this.activePID
    };
  }
}
