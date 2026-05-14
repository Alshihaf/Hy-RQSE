/**
 * Hy-RQSE System Constants
 * Derived from Reconstruction Formative Spec
 */

export const N_DEFAULT = 4096;           // Reservoir dimension
export const TARGET_SPECTRAL_RADIUS = 0.98;
export const WARMUP_STEPS = 1000;
export const AEAD_BLOCK_SIZE = 4096;     // Bytes per new ChaCha20 key
export const RECOVERY_WINDOW = 64;       // Bytes for quarantine
export const MK_ROTATION_BYTES = 10_000_000_000n; // 10 GB (using BigInt)
export const MK_ROTATION_DAYS = 30;
