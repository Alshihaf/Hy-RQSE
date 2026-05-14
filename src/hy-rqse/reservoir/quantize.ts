/**
 * Quantization module for Reservoir state projection.
 */

/**
 * Quantizes a float value in range [-1, 1] to a byte [0, 255].
 * Implementation should avoid branching for constant-time properties.
 */
export function quantizeScalar(val: number): number {
  // Map [-1, 1] -> [0, 1]
  const normalized = (val + 1) / 2;
  // Clamp to [0, 1] without branching using Math.max/min (usually implemented via CPU instructions)
  const clamped = Math.max(0, Math.min(1, normalized));
  return Math.floor(clamped * 255);
}

/**
 * Projects vector s onto V and quantizes.
 * dotProduct = sum(V[i] * s[i])
 */
export function projectAndQuantize(V: Float64Array, s: Float64Array): number {
  let dot = 0;
  for (let i = 0; i < V.length; i++) {
    dot += V[i] * s[i];
  }
  // We need to normalize the dot product if it can exceed [-1, 1].
  // Usually in ESN, with ρ < 1 and tanh activation, s is in [-1, 1].
  // If V is also normalized, the sum might exceed.
  // The spec says map [-1, 1] to byte.
  // I will apply tanh to the dot product first to ensure range [-1, 1].
  return quantizeScalar(Math.tanh(dot));
}
