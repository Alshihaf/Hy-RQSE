import { hkdf } from '@noble/hashes/hkdf.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { ReservoirMatrix } from './matrix.ts';
import { ReservoirState } from './state.ts';

/**
 * Expand a 32-byte seed into requested number of bytes.
 * Browser-compatible version using BLAKE3 as a PRG.
 */
function expandSeed(seed: Uint8Array, length: number): Uint8Array {
  const result = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  
  while (offset < length) {
    const chunk = blake3(new Uint8Array([...seed, ...new TextEncoder().encode(counter.toString())]));
    const toCopy = Math.min(chunk.length, length - offset);
    result.set(chunk.slice(0, toCopy), offset);
    offset += toCopy;
    counter++;
  }
  return result;
}

/**
 * Maps a Uint8Array to a Float64Array in the range [-1, 1].
 */
function fillFloat64(source: Uint8Array, dest: Float64Array): void {
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  for (let i = 0; i < dest.length; i++) {
    // We read 8 bytes for double precision, but we can also just use 4 bytes or similar.
    // Spec says N*N*8, so it expects 8 bytes per f64.
    const u64 = view.getBigUint64(i * 8, true);
    // Map max u64 to range [-1, 1]
    const f64 = (Number(u64) / Number(0xFFFFFFFFFFFFFFFFn)) * 2 - 1;
    dest[i] = f64;
  }
}

/**
 * Power iteration to find spectral radius ρ(W)
 */
function calculateSpectralRadius(W: ReservoirMatrix, iterations: number = 10): number {
  const n = W.n;
  let v = new Float64Array(n).fill(1); // Start with ones
  let temp = new Float64Array(n);

  for (let iter = 0; iter < iterations; iter++) {
    // v = W * v
    W.multiplyVector(v, temp);
    
    // Normalize v
    let norm = 0;
    for (let i = 0; i < n; i++) norm += temp[i] * temp[i];
    norm = Math.sqrt(norm);
    
    for (let i = 0; i < n; i++) v[i] = temp[i] / norm;
  }

  // ρ(W) ≈ ||Wv|| / ||v||. Since ||v|| is 1:
  W.multiplyVector(v, temp);
  let spectralRadius = 0;
  for (let i = 0; i < n; i++) spectralRadius += temp[i] * temp[i];
  return Math.sqrt(spectralRadius);
}

const encoder = new TextEncoder();

export async function initializeReservoir(sk: Uint8Array, n: number): Promise<ReservoirState> {
  const derive = (info: string, len: number) => hkdf(blake3, sk, undefined, encoder.encode(info), len);

  // W
  const wSeed = derive("W", 32);
  const wBytes = expandSeed(wSeed, n * n * 8);
  const W = new ReservoirMatrix(n);
  fillFloat64(wBytes, W.data);

  // Normalize spectral radius
  const rho = calculateSpectralRadius(W);
  const targetRho = 0.98;
  const scale = targetRho / rho;
  for (let i = 0; i < W.data.length; i++) W.data[i] *= scale;

  // V, u, b, s0, Win
  const fillVec = (info: string) => {
    const bytes = expandSeed(derive(info, 32), n * 8);
    const vec = new Float64Array(n);
    fillFloat64(bytes, vec);
    return vec;
  };

  const V = fillVec("V");
  const u = fillVec("u");
  const b = fillVec("b");
  const s0Raw = fillVec("s0");
  const Win = fillVec("Win");

  // s0 = tanh(s0Raw)
  const s0 = new Float64Array(n);
  for (let i = 0; i < n; i++) s0[i] = Math.tanh(s0Raw[i]);

  return new ReservoirState(n, W, Win, b, u, s0);
}
