import { createLogger } from '@aztec/foundation/log';
import { BundleArtifactProvider } from '@aztec/noir-protocol-circuits-types/client/bundle';
import type { CircuitSimulator } from '@aztec/simulator/client';

import { BBPrivateKernelProver } from '../bb_private_kernel_prover.js';

export class BBWASMBundlePrivateKernelProver extends BBPrivateKernelProver {
  constructor(simulator: CircuitSimulator, _: number, log = createLogger('bb-prover:wasm:bundle')) {
    super(new BundleArtifactProvider(), simulator, log);
  }
}
