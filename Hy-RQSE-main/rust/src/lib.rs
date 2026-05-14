#![no_std]
#![feature(alloc_error_handler)]

pub mod layers;
pub mod reservoir;
pub mod crypto;
pub mod arch;

pub use reservoir::Reservoir;

/// Hy-RQSE OS Kernel State
pub struct KernelState {
    pub reservoir: Reservoir,
    pub is_locked: bool,
}

impl KernelState {
    pub fn boot(seed: [u8; 64]) -> Self {
        // L0: Chaotic Kernel Envelope Initialization
        let mut res = Reservoir::new(seed);
        res.warmup(1000);
        Self {
            reservoir: res,
            is_locked: false,
        }
    }
}
