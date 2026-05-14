import { hkdf } from '@noble/hashes/hkdf.js';
import { blake3 } from '@noble/hashes/blake3.js';

/**
 * Key Derivation Hierarchy
 * Implementation of RK -> MK -> SK
 */

const encoder = new TextEncoder();

export function deriveMK(rk: Uint8Array, version: string = "v1"): Uint8Array {
  // MK0 = HKDF-BLAKE3(RK, b"master-key-v1", 256)
  return hkdf(blake3, rk, undefined, encoder.encode(`master-key-${version}`), 32);
}

export function deriveSKSeed(
  mk: Uint8Array, 
  dh: Uint8Array, 
  pubA: Uint8Array, 
  pubB: Uint8Array
): Uint8Array {
  // SK_seed = HKDF-BLAKE3(MK, dh || eA_pub || eB_pub || b"session-v2", 512)
  const salt = new Uint8Array([...dh, ...pubA, ...pubB]);
  return hkdf(blake3, mk, salt, encoder.encode("session-v2"), 64); // 512 bits = 64 bytes
}

export function deriveSK(seed: Uint8Array, extraEntropy?: Uint8Array): Uint8Array {
  // SK = HKDF-BLAKE3(SK_seed, b"aad-entropy" || opsional_beacon_entropy, 512)
  const infoPrefix = encoder.encode("aad-entropy");
  const info = extraEntropy ? new Uint8Array([...infoPrefix, ...extraEntropy]) : infoPrefix;
  return hkdf(blake3, seed, undefined, info, 64);
}
