import { EphemeralKeyPair } from '../kex/ephemeral.ts';
import { deriveSKSeed, deriveSK } from '../kdf/hierarchy.ts';
import { initializeReservoir } from '../reservoir/init.ts';
import { HybridAEAD } from '../aead/hybrid.ts';
import { zeroize } from '../utils/zeroize.ts';
import { HyRQSEConfig } from '../config.ts';
import { telemetry } from '../telemetry.ts';

/**
 * Session States
 */
export enum SessionRole {
  Initiator,
  Responder
}

export class HyRQSESession {
  private sk: Uint8Array | null = null;
  private aead: HybridAEAD | null = null;
  private nonceCounter: bigint = 0n;

  constructor(public readonly role: SessionRole) {}

  /**
   * Step 1 & 2: Handshake and SK Derivation
   */
  async establish(
    mk: Uint8Array,
    myKeyPair: EphemeralKeyPair,
    theirPublicKey: Uint8Array,
    config: HyRQSEConfig
  ): Promise<void> {
    telemetry.setEnabled(config.telemetryEnabled);
    
    const dh = myKeyPair.computeSharedSecret(theirPublicKey);
    
    let pubA, pubB;
    if (this.role === SessionRole.Initiator) {
      pubA = myKeyPair.publicKey;
      pubB = theirPublicKey;
    } else {
      pubA = theirPublicKey;
      pubB = myKeyPair.publicKey;
    }

    const skSeed = deriveSKSeed(mk, dh, pubA, pubB);
    this.sk = deriveSK(skSeed);

    // Step 3: Initialize Reservoir
    const reservoirState = await initializeReservoir(this.sk, config.n);
    
    // Step 4: Warmup
    reservoirState.warmup(config.warmupSteps);

    this.aead = new HybridAEAD(reservoirState, reservoirState.u);

    // Cleanup
    zeroize(dh);
    zeroize(skSeed);
    myKeyPair.destroy();
  }

  /**
   * Encrypt a message
   */
  encrypt(plaintext: Uint8Array, aad: Uint8Array = new Uint8Array()): { ciphertext: Uint8Array, tag: Uint8Array, nonce: Uint8Array } {
    if (!this.aead) throw new Error("Session not established");

    // 96-bit nonce from counter
    const nonce = new Uint8Array(12);
    const view = new DataView(nonce.buffer);
    view.setBigUint64(4, this.nonceCounter, true);
    this.nonceCounter++;

    const result = this.aead.encrypt(plaintext, aad, nonce);
    return { ...result, nonce };
  }

  /**
   * Decrypt a message
   */
  decrypt(ciphertext: Uint8Array, tag: Uint8Array, nonce: Uint8Array, aad: Uint8Array = new Uint8Array()): Uint8Array {
    if (!this.aead) throw new Error("Session not established");

    return this.aead.decrypt(ciphertext, tag, aad, nonce);
  }

  destroy(): void {
    if (this.sk) zeroize(this.sk);
    // AEAD and Reservoir contain Float64Arrays and keys, they should also be zeroized
    // In a full implementation, we'd add .destroy() to all components.
  }
}
