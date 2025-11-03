---
id: creating_keystores
sidebar_position: 0
title: Creating Validator Keystores
description: Learn how to create validator keystores for sequencers and provers using the Aztec CLI.
---

## Overview

Validator keystores are configuration files that store the cryptographic keys and addresses your sequencer or prover node needs to operate on the Aztec network. This guide shows you how to create basic keystores using the Aztec CLI's `validator-keys` commands.

For advanced configurations like multiple publishers, encrypted keystores, remote signers, or BLS keys for staking, see the guides linked at the end of this document.

## What Are Validator Keystores?

A validator keystore is a JSON file (typically named `keystore.json`) that contains:

**For sequencers:**
- **Attester keys**: Your sequencer's identity used to sign block proposals and attestations
- **Publisher keys**: Keys used to submit blocks to L1 (requires ETH for gas)
- **Coinbase address**: Ethereum address that receives L1 block rewards
- **Fee recipient** (optional): Aztec address that receives L2 transaction fees
- **BLS keys** (for staking): Public keys and proof of possession required for staking onchain

**For provers:**
- **Prover ID**: Ethereum address identifying your prover and receiving rewards
- **Publisher keys**: Keys used to submit proofs to L1 (requires ETH for gas)

## Prerequisites

Before creating keystores, ensure you have:

- The Aztec CLI installed (version 2.0.2 or later)
- Basic understanding of Ethereum addresses and private keys

Verify your CLI installation:

```bash
aztec --version
```

:::note Fee Recipient Parameter
The CLI requires the `--fee-recipient` flag, but the fee recipient is optional in keystores. Use the zero address if you don't want to specify one now:

```bash
--fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000
```

You can edit the keystore file afterward to add or update the fee recipient.
:::

## Creating Your First Keystore

### Simple Sequencer Keystore

Create a basic sequencer keystore with a single validator:

```bash
aztec validator-keys new \
  --fee-recipient [YOUR_AZTEC_FEE_RECIPIENT_ADDRESS]
```

Replace `[YOUR_AZTEC_FEE_RECIPIENT_ADDRESS]` with your Aztec address that will receive L2 transaction fees, or use the zero address if you don't want to specify it now:

```bash
aztec validator-keys new \
  --fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000
```

This command:
- Generates new Ethereum keys for your sequencer
- Creates a keystore at `~/.aztec/keystore/key1.json`
- Outputs your sequencer's attester address and other public information

**Example output:**

```text
Wrote validator keystore to /Users/your-name/.aztec/keystore/key1.json

Validator 0:
  Attester Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  Publisher Addresses: 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063
  Coinbase: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  Fee Recipient: 0x0000000000000000000000000000000000000000000000000000000000000000
```

:::tip Save Your Keys
The keystore file contains private keys. Back it up securely and never commit it to version control.
:::

### Simple Prover Keystore

Create a basic prover keystore:

```bash
aztec validator-keys new \
  --fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000 \
  --data-dir ~/.aztec/prover-keys \
  --file prover.json
```

For provers, use the zero address for the fee recipient parameter since it's not applicable.

## Understanding the Keystore Output

After creation, you'll have a `keystore.json` file with this structure:

```json
{
  "schemaVersion": 1,
  "validators": [
    {
      "attester": "0x1234567890123456789012345678901234567890123456789012345678901234",
      "publisher": ["0x2345678901234567890123456789012345678901234567890123456789012345"],
      "coinbase": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "feeRecipient": "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  ]
}
```

**Key fields:**

- **`attester`**: Private key or address for your sequencer identity
- **`publisher`**: Array of private keys or addresses for L1 transaction submission
- **`coinbase`**: Ethereum address receiving L1 rewards (defaults to attester address)
- **`feeRecipient`**: Aztec address receiving L2 fees (optional)

## Specifying Output Location

### Custom Directory and Filename

```bash
aztec validator-keys new \
  --fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000 \
  --data-dir ~/my-sequencer/keys \
  --file sequencer1.json
```

This creates the keystore at `~/my-sequencer/keys/sequencer1.json`.

### Default Behavior

If you don't specify `--data-dir` or `--file`:
- **Default directory**: `~/.aztec/keystore/`
- **Default filename**: `key1.json` (or `key2.json`, `key3.json`, etc. if the file exists)

## Verifying Your Keystore

### Check Keystore Format

Verify the keystore is valid JSON:

```bash
cat ~/.aztec/keystore/key1.json | jq .
```

If this command outputs formatted JSON, your keystore syntax is valid.

### Verify File Permissions

Ensure your keystore has appropriate permissions:

```bash
ls -la ~/.aztec/keystore/key1.json
```

**Recommended permissions:** `600` (read/write for owner only)

```bash
chmod 600 ~/.aztec/keystore/key1.json
```

### Extract Publisher Addresses

Get the publisher addresses you need to fund with ETH:

```bash
jq -r '.validators[].publisher[]' ~/.aztec/keystore/key1.json
```

Fund these addresses with testnet ETH before starting your node.

## Common Issues

### "fee-recipient is required"

**Error message:**
```text
error: required option '--fee-recipient <address>' not specified
```

**Solution:** The CLI requires the `--fee-recipient` flag. If you don't need to specify one now, use the zero address:

```bash
aztec validator-keys new \
  --fee-recipient 0x0000000000000000000000000000000000000000000000000000000000000000
```

You can edit the keystore afterward to add the actual fee recipient address.

### Permission Denied

**Error message:**
```text
Error: permission denied
```

**Solution:** Ensure you have write permissions for the target directory:

```bash
# Create directory if it doesn't exist
mkdir -p ~/aztec-sequencer/keys

# Set proper permissions
chmod 755 ~/aztec-sequencer/keys
```

## Next Steps

Now that you've created a basic keystore, explore advanced options and configurations:

### Advanced Keystore Options

**Multiple validators and publishers:**
- [Advanced Configuration Patterns](./advanced_patterns.md) - Multiple validators per node, multiple publishers for redundancy

**Secure key storage:**
- [Key Storage Methods](./storage_methods.md) - Remote signers, encrypted keystores, mnemonics, BLS keys for staking

**Complete examples:**
- High availability sequencers
- Production deployments with remote signers
- Delegated stake providers
- Infrastructure provider setups

**Troubleshooting and security:**
- [Troubleshooting and Best Practices](./troubleshooting.md) - Common issues and security recommendations

### Setting Up Your Node

Once you have your keystore:

**For sequencers:**
1. Fund your publisher addresses with at least 0.1 ETH
2. Configure your sequencer node - see [Running a Sequencer](../../setup/sequencer_management.md)
3. Register your sequencer with the network via zkPassport
4. Monitor your node for successful attestations

**For provers:**
1. Fund your publisher addresses with ETH for L1 gas
2. Set up your prover infrastructure - see [Running a Prover](../../setup/running_a_prover.md)
3. Configure the prover node to use the keystore
4. Monitor proof generation and submissions

**For staking:**
- All sequencers need BLS keys to stake - see [Key Storage Methods - BLS Keys](./storage_methods.md#bls-keys-for-staking)
- For delegated stake providers - see [Running Delegated Stake](../../the_aztec_network/operation/sequencer_management/running_delegated_stake.md)

## CLI Reference

### Basic Commands

```bash
# Create new keystore
aztec validator-keys new [options]

# Add to existing keystore
aztec validator-keys add <existing-keystore-path> [options]

# Generate BLS keypair only
aztec generate-bls-keypair [options]
```

### Common Options

| Option | Description | Default |
|--------|-------------|---------|
| `--fee-recipient` | Aztec address for L2 fees (required flag) | None |
| `--data-dir` | Directory for keystores | `~/.aztec/keystore` |
| `--file` | Keystore filename | `key1.json` |
| `--count` | Number of validators | `1` |
| `--publisher-count` | Publishers per validator | `1` |

For the complete list of options, run:

```bash
aztec validator-keys new --help
aztec validator-keys add --help
```
