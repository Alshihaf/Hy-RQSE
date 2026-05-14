import { zeroize } from '../utils/zeroize.ts';

export class ReservoirMatrix {
  public data: Float64Array;
  
  constructor(public readonly n: number) {
    this.data = new Float64Array(n * n);
  }

  /**
   * Performs matrix-vector multiplication: dest = (W * v)
   */
  multiplyVector(v: Float64Array, dest: Float64Array): void {
    const n = this.n;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const rowOffset = i * n;
      for (let j = 0; j < n; j++) {
        sum += this.data[rowOffset + j] * v[j];
      }
      dest[i] = sum;
    }
  }

  destroy(): void {
    zeroize(this.data);
  }
}

export class ReservoirVector {
  public data: Float64Array;
  constructor(public readonly n: number) {
    this.data = new Float64Array(n);
  }
  destroy(): void {
    zeroize(this.data);
  }
}
