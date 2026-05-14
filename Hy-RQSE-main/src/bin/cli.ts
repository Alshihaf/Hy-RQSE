import { EphemeralKeyPair } from '../hy-rqse/kex/ephemeral.ts';
import { HyRQSESession, SessionRole } from '../hy-rqse/session/state_machine.ts';
import { deriveMK } from '../hy-rqse/kdf/hierarchy.ts';
import { loadConfig } from '../hy-rqse/config.ts';
import { telemetry } from '../hy-rqse/telemetry.ts';
import { randomBytes } from 'node:crypto';

async function testHyRQSE() {
  console.log("--- Hy-RQSE Configuration & Telemetry Test ---");

  // 0. Load Configuration
  const config = loadConfig();
  console.log("Configuration Loaded:", {
    n: config.n,
    mode: config.mode,
    kex: config.kex,
    telemetry: config.telemetryEnabled
  });

  // 1. Root Key and Master Key Setup
  const rk = randomBytes(32);
  const mk = deriveMK(rk);

  // 2. Handshake Phase
  const keyA = EphemeralKeyPair.generate();
  const keyB = EphemeralKeyPair.generate();

  const sessionA = new HyRQSESession(SessionRole.Initiator);
  const sessionB = new HyRQSESession(SessionRole.Responder);

  console.log("Handshake starting...");
  await Promise.all([
    sessionA.establish(mk, keyA, keyB.publicKey, config),
    sessionB.establish(mk, keyB, keyA.publicKey, config)
  ]);
  console.log("Handshake complete.");

  // 3. Data Encryption/Decryption
  const messages = [
    "Pesan rahasia 1",
    "Pesan rahasia 2 dengan konten lebih panjang untuk testing telemetri",
    "Hy-RQSE Reconstruction verified"
  ];

  for (const msg of messages) {
    const plaintext = new TextEncoder().encode(msg);
    const { ciphertext, tag, nonce } = sessionA.encrypt(plaintext);
    const decrypted = sessionB.decrypt(ciphertext, tag, nonce);
    console.log(`Verified: ${new TextDecoder().decode(decrypted) === msg}`);
  }

  // 4. Show Telemetry
  const stats = telemetry.getSummary();
  if (stats) {
    console.log("\n--- Anonymous Telemetry Summary ---");
    console.log(`Total Operations: ${stats.totalOperations}`);
    console.log(`Avg Encrypt Speed: ${stats.encryptAvgMs.toFixed(3)} ms`);
    console.log(`Avg Decrypt Speed: ${stats.decryptAvgMs.toFixed(3)} ms`);
    console.log(`Total Failures: ${stats.failures}`);
    console.log(`Reservoir Dimension: ${stats.lastDimension}`);
  }
}

testHyRQSE().catch(console.error);
