import { x25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from 'node:crypto';
import { zeroize } from '../utils/zeroize.ts';

export class EphemeralKeyPair {
  constructor(
    public readonly privateKey: Uint8Array,
    public readonly publicKey: Uint8Array
  ) {}

  static generate(): EphemeralKeyPair {
    const priv = randomBytes(32);
    const pub = x25519.getPublicKey(priv);
    return new EphemeralKeyPair(new Uint8Array(priv), pub);
  }

  computeSharedSecret(otherPublicKey: Uint8Array): Uint8Array {
    return x25519.getSharedSecret(this.privateKey, otherPublicKey);
  }

  destroy(): void {
    zeroize(this.privateKey);
  }
}
