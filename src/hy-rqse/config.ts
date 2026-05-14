import * as toml from 'smol-toml';
import minimist from 'minimist';
import { readFileSync, existsSync } from 'node:fs';

export enum HyRQSEMode {
  Full = "Full",
  Lite = "Lite",
  Experiment = "Experiment",
  PostQuantum = "Post-Quantum"
}

export enum KEXAlgorithm {
  X25519 = "X25519",
  MLKEM1024 = "ML-KEM-1024"
}

export interface HyRQSEConfig {
  n: number;
  mode: HyRQSEMode;
  kex: KEXAlgorithm;
  telemetryEnabled: boolean;
  targetSpectralRadius: number;
  warmupSteps: number;
  aeadBlockSize: number;
}

const DEFAULTS: HyRQSEConfig = {
  n: 4096,
  mode: HyRQSEMode.Full,
  kex: KEXAlgorithm.X25519,
  telemetryEnabled: true,
  targetSpectralRadius: 0.98,
  warmupSteps: 1000,
  aeadBlockSize: 4096
};

export function loadConfig(configPath: string = 'hy-rqse.toml'): HyRQSEConfig {
  let fileConfig: Partial<HyRQSEConfig> = {};
  
  // 1. Load from TOML if exists
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      fileConfig = toml.parse(content) as unknown as Partial<HyRQSEConfig>;
    } catch (e) {
      console.warn(`Warning: Failed to parse config file ${configPath}:`, e);
    }
  }

  // 2. Parse CLI arguments
  const argv = minimist(process.argv.slice(2));
  const cliConfig: Partial<HyRQSEConfig> = {};
  
  if (argv.n) cliConfig.n = parseInt(argv.n, 10);
  if (argv.mode) cliConfig.mode = argv.mode as HyRQSEMode;
  if (argv.kex) cliConfig.kex = argv.kex as KEXAlgorithm;
  if (argv['telemetry-enabled'] !== undefined) {
    cliConfig.telemetryEnabled = argv['telemetry-enabled'] === 'true' || argv['telemetry-enabled'] === true;
  }

  // 3. Merge: Default <- File <- CLI
  const config = {
    ...DEFAULTS,
    ...fileConfig,
    ...cliConfig
  };

  // Adjust N based on mode if not explicitly set
  if (!cliConfig.n && !fileConfig.n) {
    if (config.mode === HyRQSEMode.Lite) config.n = 1024;
  }
  
  // Handle Post-Quantum KEX enforcement
  if (config.mode === HyRQSEMode.PostQuantum) {
    config.kex = KEXAlgorithm.MLKEM1024;
  }

  return config;
}
