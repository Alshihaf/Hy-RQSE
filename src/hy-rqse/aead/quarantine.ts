import { blake3 } from '@noble/hashes/blake3.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { ctEqual } from '../utils/constant_time.ts';

/**
 * Quarantine buffer for desync recovery.
 */
export class QuarantineBuffer {
  private buffer: number[] = [];
  private readonly windowSize: number = 64;

  constructor(private sk: Uint8Array) {}

  push(chunk: Uint8Array): void {
    for (const b of chunk) {
      this.buffer.push(b);
    }
  }

  /**
   * Verifies the buffer against a provided MAC.
   */
  verifyAndRelease(providedMac: Uint8Array): Uint8Array | null {
    if (this.buffer.length < this.windowSize) return null;

    const data = new Uint8Array(this.buffer);
    const expectedMac = hkdf(blake3, this.sk, undefined, data, 32);

    if (ctEqual(expectedMac, providedMac)) {
      this.buffer = [];
      return data;
    }

    return null;
  }

  clear(): void {
    this.buffer = [];
  }
}
