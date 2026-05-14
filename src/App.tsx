import { useEffect } from 'react';
import { HyRQSEOSEngine } from './hy-rqse/os-engine.ts';

/**
 * Headless Entry Point for Hy-RQSE OS
 * All logic resides in the kernel core.
 */
export default function App() {
  useEffect(() => {
    const kernel = new HyRQSEOSEngine();
    
    const runKernel = async () => {
      console.log("[KERNEL] Initializing Hy-RQSE OS Core...");
      await kernel.init(new Uint8Array(32).fill(0x55));
      
      // Main Execution Loop
      setInterval(() => {
        kernel.executeCycle();
        const metrics = kernel.getMetrics();
        // Silent execution or standard log
        if (Math.random() < 0.01) {
           console.log(`[SYS_STATE] VPC: 0x${metrics.vpc} | Entropy: ${metrics.entropy.toFixed(6)}`);
        }
      }, 10);
    };

    runKernel().catch(console.error);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#333', height: '100vh', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontFamily: 'monospace' }}>
      [ HY-RQSE_OS_HEADLESS_MODE_ACTIVE ]
    </div>
  );
}

