/**
 * Zeroization utility.
 * In JavaScript, this is best-effort due to GC, but important for clearing
 * sensitive buffers as soon as they are no longer needed.
 */
export function zeroize(buf: Uint8Array | Float64Array): void {
  buf.fill(0);
}

/**
 * Interface for types that can be zeroized.
 */
export interface Zeroizable {
  zeroize(): void;
}
