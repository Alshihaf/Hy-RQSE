import { ReservoirMatrix, ReservoirVector } from './matrix.ts';

/**
 * Reservoir State and Update Logic
 */
export class ReservoirState {
  public s: Float64Array;
  private temp: Float64Array;

  constructor(
    public readonly n: number,
    public readonly W: ReservoirMatrix,
    public readonly Win: Float64Array, // Diagonal matrix stored as vector
    public readonly b: Float64Array,
    public readonly u: Float64Array,
    s0: Float64Array
  ) {
    this.s = new Float64Array(s0);
    this.temp = new Float64Array(n);
  }

  /**
   * Update rule: s = tanh( W·s + Win·c + b )
   * @param c input scalar (usually ciphertext byte)
   */
  update(c: number): void {
    const n = this.n;
    // 1. temp = W * s
    this.W.multiplyVector(this.s, this.temp);

    // 2. add Win * c and bias b, then apply tanh
    for (let i = 0; i < n; i++) {
      const val = this.temp[i] + (this.Win[i] * c) + this.b[i];
      this.s[i] = Math.tanh(val);
    }
  }

  /**
   * Warmup steps (input 0)
   */
  warmup(steps: number): void {
    for (let i = 0; i < steps; i++) {
      this.update(0);
    }
  }
}
