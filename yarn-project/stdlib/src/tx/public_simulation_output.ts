import { Fr } from '@aztec/foundation/fields';
import type { ZodFor } from '@aztec/foundation/schemas';

import times from 'lodash.times';
import { z } from 'zod';

import { SimulationError } from '../errors/simulation_error.js';
import { Gas } from '../gas/gas.js';
import type { GasUsed } from '../gas/gas_used.js';
import { TxEffect } from '../tx/tx_effect.js';
import { GlobalVariables } from './global_variables.js';

/**
 * Outputs of processing the public component of a transaction.
 */
export class PublicSimulationOutput {
  constructor(
    public revertReason: SimulationError | undefined,
    public globalVariables: GlobalVariables,
    public txEffect: TxEffect,
    public publicReturnValues: Fr[],
    public gasUsed: GasUsed,
  ) {}

  static get schema(): ZodFor<PublicSimulationOutput> {
    return z
      .object({
        revertReason: SimulationError.schema.optional(),
        globalVariables: GlobalVariables.schema,
        txEffect: TxEffect.schema,
        publicReturnValues: z.array(Fr.schema),
        gasUsed: z.object({
          totalGas: Gas.schema,
          teardownGas: Gas.schema,
          publicGas: Gas.schema,
          billedGas: Gas.schema,
        }),
      })
      .transform(
        fields =>
          new PublicSimulationOutput(
            fields.revertReason,
            fields.globalVariables,
            fields.txEffect,
            fields.publicReturnValues,
            fields.gasUsed,
          ),
      );
  }

  static async random() {
    return new PublicSimulationOutput(
      await SimulationError.random(),
      GlobalVariables.empty(),
      TxEffect.empty(),
      times(2, Fr.random),
      { teardownGas: Gas.random(), totalGas: Gas.random(), publicGas: Gas.random(), billedGas: Gas.random() },
    );
  }
}
