---
id: running_a_prover
sidebar_position: 4
title: Running a Prover
description: A comprehensive guide on how to run an Aztec prover on the network using Docker Compose in single-machine or distributed configurations.
---

## Overview

This guide covers the steps required to run a prover on the Aztec network. Operating a prover is a resource-intensive role typically undertaken by experienced engineers due to its technical complexity and hardware requirements.

Aztec provers are critical infrastructure components. They generate cryptographic proofs attesting to transaction correctness, ultimately producing a single rollup proof submitted to Ethereum.

:::tip Prerequisites
Before proceeding, ensure you've reviewed and completed the [prerequisites](../prerequisites.md) for the Docker Compose method.
:::

:::info Deployment Method
This guide uses the **Docker Compose method**. This is the recommended approach for prover nodes due to the complexity of managing distributed components.
:::

## Prover Architecture

The prover consists of three main components:

1. **Prover node**: Polls L1 for unproven epochs, creates prover jobs, distributes them to the broker, and submits the final rollup proof to the rollup contract.

2. **Prover broker**: Manages the job queue, distributing work to agents and collecting results.

3. **Prover agent(s)**: Executes proof generation jobs in a stateless manner.

## Minimum Requirements

### Prover Node

- 2 core / 4 vCPU (released in 2015 or later)
- 16 GB RAM
- 1 TB NVMe SSD
- 25 Mbps network connection

### Prover Broker

- 2 core / 4 vCPU (released in 2015 or later)
- 16 GB RAM
- 10 GB SSD

### Prover Agents

**For each agent:**
- 32 core / 64 vCPU (released in 2015 or later)
- 128 GB RAM
- 10 GB SSD

These requirements are subject to change as the network throughput increases. Prover agents require high-performance hardware, typically data center-grade infrastructure.

:::tip Running Multiple Agents
You can run multiple prover agents on a single machine by adjusting `PROVER_AGENT_COUNT`. Hardware requirements scale approximately linearly:
- **2 agents**: 64 cores, 256 GB RAM
- **3 agents**: 96 cores, 384 GB RAM
- **4 agents**: 128 cores, 512 GB RAM

This scaling applies to both single-machine and distributed setups.
:::

**Before proceeding:** Ensure you've reviewed and completed the [prerequisites](../prerequisites.md) for the Docker Compose method. This guide uses Docker Compose, which is the recommended approach for prover nodes.

## Generating Keys

Before setting up your prover, generate a keystore using the Aztec CLI:

```bash
aztec validator-keys new \
  --fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000 \
  --data-dir ~/prover-keys \
  --file prover-keystore.json
```

This creates a keystore with the keys needed for your prover. Note the publisher addresses from the output—you'll need to fund these with ETH.

For advanced options like multiple publishers, encrypted keystores, or remote signers, see the [Creating Validator Keystores guide](../operation/keystore/creating_keystores.md).

:::warning Account Funding Required
The publisher account(s) need to be funded with ETH to post proofs to L1. Ensure accounts hold sufficient ETH for gas costs during operation.
:::

## Setup Options

Choose the setup method that best fits your infrastructure:

- **[Single Machine Setup](./prover_single_machine.md)**: Run all prover components on a single high-performance machine. Ideal for testing or smaller-scale operations.
- **[Distributed Setup](./prover_distributed.md)**: Distribute prover components across multiple machines for production deployments with better resource utilization and scalability.

After completing your setup, proceed to [Prover Verification and Troubleshooting](./prover_verification_troubleshooting.md) to verify your prover is working correctly and for help with common issues.
