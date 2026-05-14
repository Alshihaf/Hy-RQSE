import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time byte array equality.
 * Uses Node.js crypto.timingSafeEqual for security.
 */
export function ctEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Constant-time selection.
 * returns a if choice is 1, b if choice is 0.
 * choice must be 0 or 1.
 */
export function ctSelect(choice: number, a: number, b: number): number {
  const mask = -(choice & 1);
  return (a & mask) | (b & ~mask);
}
