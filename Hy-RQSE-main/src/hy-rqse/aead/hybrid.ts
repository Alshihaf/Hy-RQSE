import { blake3 } from '@noble/hashes/blake3.js';
import { ReservoirState } from '../reservoir/state.ts';
import { projectAndQuantize } from '../reservoir/quantize.ts';
import { telemetry } from '../telemetry.ts';

// Browser-safe Buffer/Crypto check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Hybrid Reservoir-AEAD module.
 */
export class HybridAEAD {
  constructor(
    private reservoir: ReservoirState,
    private V: Float64Array
  ) {}

  private deriveKeyFromReservoir(): Uint8Array {
    const entropy = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      const b = projectAndQuantize(this.V, this.reservoir.s);
      entropy[i] = b;
      this.reservoir.update(0);
    }
    return blake3(entropy);
  }

  encrypt(plaintext: Uint8Array, aad: Uint8Array, nonce: Uint8Array): { ciphertext: Uint8Array, tag: Uint8Array } {
    if (!isNode) {
      // Simulation mode for browser
      const ciphertext = new Uint8Array(plaintext.length);
      for (let i = 0; i < plaintext.length; i++) {
        ciphertext[i] = plaintext[i] ^ Math.floor(Math.random() * 256);
        this.reservoir.update(ciphertext[i]);
      }
      return { ciphertext, tag: new Uint8Array(16) };
    }

    // Node.js implementation
    const { createCipheriv } = require('node:crypto');
    const { Buffer } = require('node:buffer');
    const start = performance.now();
    let success = false;
    let errorMsg: string | undefined;

    try {
      const key = this.deriveKeyFromReservoir();
      const cipher = createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });
      cipher.setAAD(Buffer.from(aad), { plaintextLength: plaintext.length });

      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();

      for (const c of ciphertext) {
        this.reservoir.update(c);
      }

      success = true;
      return { ciphertext: new Uint8Array(ciphertext), tag: new Uint8Array(tag) };
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      telemetry.record({
        dimension: this.reservoir.n,
        operation: 'encrypt',
        durationMs: performance.now() - start,
        dataSize: plaintext.length,
        success,
        error: errorMsg
      });
    }
  }

  decrypt(ciphertext: Uint8Array, tag: Uint8Array, aad: Uint8Array, nonce: Uint8Array): Uint8Array {
    if (!isNode) {
      // Simulation mode
      const plaintext = new Uint8Array(ciphertext.length);
      for (let i = 0; i < ciphertext.length; i++) {
        plaintext[i] = ciphertext[i] ^ 0; // Fake
        this.reservoir.update(ciphertext[i]);
      }
      return plaintext;
    }

    const { createDecipheriv } = require('node:crypto');
    const { Buffer } = require('node:buffer');
    const start = performance.now();
    let success = false;
    let errorMsg: string | undefined;

    try {
      const key = this.deriveKeyFromReservoir();
      const decipher = createDecipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });
      decipher.setAAD(Buffer.from(aad), { plaintextLength: ciphertext.length });
      decipher.setAuthTag(Buffer.from(tag));

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      
      for (const c of ciphertext) {
        this.reservoir.update(c);
      }

      success = true;
      return new Uint8Array(plaintext);
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      telemetry.record({
        dimension: this.reservoir.n,
        operation: 'decrypt',
        durationMs: performance.now() - start,
        dataSize: ciphertext.length,
        success,
        error: errorMsg
      });
    }
  }
}
