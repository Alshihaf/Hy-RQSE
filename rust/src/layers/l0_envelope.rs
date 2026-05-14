/*
 * L0: Chaotic Kernel Envelope
 * - Instruksi CPU didekode dari state reservoir on-the-fly.
 */

pub struct Envelope;

impl Envelope {
    pub fn decode_instruction(state: &[i32]) -> u8 {
        // Mengubah state numerik menjadi opcode instruksi
        let mut sum = 0;
        for &s in state.iter().take(8) {
            sum ^= s;
        }
        (sum & 0xFF) as u8
    }
}
