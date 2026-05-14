/// L3: Execution Path Obfuscation (EPO)
/// Menentukan alamat instruksi berikutnya berdasarkan chaos state
pub struct Dispatcher;

impl Dispatcher {
    pub fn get_next_pc(base_pc: usize, state_sum: i32, page_size: usize) -> usize {
        // next_pc = base_pc + quantize(V·s) mod page_size
        let offset = (state_sum as usize).wrapping_mul(0xBEEF) % page_size;
        base_pc + offset
    }
}
