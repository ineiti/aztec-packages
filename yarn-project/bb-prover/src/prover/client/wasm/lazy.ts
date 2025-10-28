import { createLogger } from '@aztec/foundation/log';
import { LazyArtifactProvider } from '@aztec/noir-protocol-circuits-types/client/lazy';
import type { CircuitSimulator } from '@aztec/simulator/client';

import { BBPrivateKernelProver } from '../bb_private_kernel_prover.js';

export class BBWASMLazyPrivateKernelProver extends BBPrivateKernelProver {
  constructor(simulator: CircuitSimulator, _: number, log = createLogger('bb-prover:wasm:lazy')) {
    super(new LazyArtifactProvider(), simulator, log);
  }
}
