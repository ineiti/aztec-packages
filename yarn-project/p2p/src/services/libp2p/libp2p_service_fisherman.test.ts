import type { EpochCache } from '@aztec/epoch-cache';
import { Secp256k1Signer } from '@aztec/foundation/crypto';
import { Fr } from '@aztec/foundation/fields';
import { type Logger, createLogger } from '@aztec/foundation/log';
import { type PromiseWithResolvers, promiseWithResolvers } from '@aztec/foundation/promise';
import { retryUntil } from '@aztec/foundation/retry';
import { sleep } from '@aztec/foundation/sleep';
import { emptyChainConfig } from '@aztec/stdlib/config';
import type { WorldStateSynchronizer } from '@aztec/stdlib/interfaces/server';
import { BlockAttestation, BlockProposal } from '@aztec/stdlib/p2p';
import { type MakeConsensusPayloadOptions, makeBlockProposal, makeL2BlockHeader } from '@aztec/stdlib/testing';
import { TxHash } from '@aztec/stdlib/tx';

import { describe, expect, it, jest } from '@jest/globals';
import type { PeerId } from '@libp2p/interface';
import { type MockProxy, mock } from 'jest-mock-extended';

import type { P2PClient } from '../../client/p2p_client.js';
import { type P2PConfig, getP2PDefaultConfig } from '../../config.js';
import type { AttestationPool } from '../../mem_pools/attestation_pool/attestation_pool.js';
import { mockAttestation } from '../../mem_pools/attestation_pool/mocks.js';
import type { TxPool } from '../../mem_pools/tx_pool/index.js';
import type { LibP2PService } from '../../services/libp2p/libp2p_service.js';
import { type MakeTestP2PClientOptions, makeAndStartTestP2PClients } from '../../test-helpers/make-test-p2p-clients.js';
import { MockGossipSubNetwork } from '../../test-helpers/mock-pubsub.js';

const TEST_TIMEOUT = 60_000;
jest.setTimeout(TEST_TIMEOUT);

describe('libp2p service fisherman mode', () => {
  let txPool: MockProxy<TxPool>;
  let attestationPool: MockProxy<AttestationPool>;
  let epochCache: MockProxy<EpochCache>;
  let worldState: MockProxy<WorldStateSynchronizer>;

  let logger: Logger;
  let p2pBaseConfig: P2PConfig;

  let clients: P2PClient[] = [];

  beforeEach(() => {
    clients = [];
    txPool = mock<TxPool>();
    attestationPool = mock<AttestationPool>();
    epochCache = mock<EpochCache>();
    worldState = mock<WorldStateSynchronizer>();

    logger = createLogger('p2p:test:fisherman');
    p2pBaseConfig = { ...emptyChainConfig, ...getP2PDefaultConfig() };

    //@ts-expect-error - we want to mock the getEpochAndSlotInNextL1Slot method, mocking ts is enough
    epochCache.getEpochAndSlotInNextL1Slot.mockReturnValue({ ts: BigInt(0) });
    epochCache.getRegisteredValidators.mockResolvedValue([]);

    txPool.hasTxs.mockResolvedValue([]);
    txPool.getAllTxs.mockImplementation(() => {
      return Promise.resolve([]);
    });
    txPool.addTxs.mockResolvedValue(1);
    txPool.getTxsByHash.mockImplementation(() => {
      return Promise.resolve([]);
    });

    worldState.status.mockResolvedValue({
      state: mock(),
      syncSummary: {
        latestBlockNumber: 0,
        latestBlockHash: '',
        finalizedBlockNumber: 0,
        treesAreSynched: false,
        oldestHistoricBlockNumber: 0,
      },
    });
    logger.info(`Starting test ${expect.getState().currentTestName}`);
  });

  afterEach(async () => {
    logger.info(`Tearing down state for ${expect.getState().currentTestName}`);
    await shutdown(clients);
    logger.info('Shut down p2p clients');

    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();

    clients = [];
  });

  // Shutdown all test clients
  const shutdown = async (clients: P2PClient[]) => {
    await Promise.all(clients.map(client => client.stop()));
    await sleep(1000);
  };

  // Replace the block attestation handler on a client
  const replaceBlockAttestationHandler = (client: P2PClient, promise: PromiseWithResolvers<BlockAttestation>) => {
    const p2pService = (client as any).p2pService as LibP2PService;
    // @ts-expect-error - we want to spy on received attestation handler
    const oldAttestationHandler = p2pService.processAttestationFromPeer.bind(p2pService);

    // Mock the function to just call the old one
    const handleGossipedAttestationSpy = jest.fn(async (payload: Buffer, msgId: string, source: PeerId) => {
      promise.resolve(BlockAttestation.fromBuffer(payload));
      await oldAttestationHandler(payload, msgId, source);
    });
    // @ts-expect-error - replace with our own handler
    p2pService.processAttestationFromPeer = handleGossipedAttestationSpy;

    return handleGossipedAttestationSpy;
  };

  it('should NOT broadcast attestations when fishermanMode is enabled', async () => {
    const numberOfNodes = 3;
    const mockGossipSubNetwork = new MockGossipSubNetwork();
    const testConfig: MakeTestP2PClientOptions = {
      p2pBaseConfig: { ...p2pBaseConfig, rollupVersion: 1, p2pDisableStatusHandshake: true },
      mockAttestationPool: attestationPool,
      mockTxPool: txPool,
      mockEpochCache: epochCache,
      mockWorldState: worldState,
      mockGossipSubNetwork,
      logger,
    };

    // Create 3 clients, client 3 will be in fisherman mode
    const clientsAndConfig = await makeAndStartTestP2PClients(numberOfNodes, testConfig);
    clients = clientsAndConfig.map(c => c.client);

    const [client1, client2, _client3] = clients;

    // Enable fishermanMode on client1's p2p service
    const p2pService1 = (client1 as any).p2pService as LibP2PService;
    (p2pService1 as any).config.fishermanMode = true;

    // Create a block proposal
    const blockProposal = makeBlockProposal({
      signer: Secp256k1Signer.random(),
      header: makeL2BlockHeader(),
      archive: Fr.random(),
      txHashes: [TxHash.random()],
    });

    // Create attestations that will be returned by the callback
    const attestation = mockAttestation(
      Secp256k1Signer.random(),
      Number(blockProposal.slotNumber.toBigInt()),
      blockProposal.archive,
    );

    // Register a callback that returns attestations (simulating validator behavior)
    const mockCallback = jest.fn<(block: BlockProposal, sender: PeerId) => Promise<BlockAttestation[] | undefined>>(
      (_block: BlockProposal, _sender: PeerId) => {
        return Promise.resolve([attestation]);
      },
    );
    p2pService1.registerBlockReceivedCallback(mockCallback);

    // set up spy to detect if client2 receives any attestation
    const client2AttestationPromise = promiseWithResolvers<BlockAttestation>();
    const client2HandleGossipedAttestationSpy = replaceBlockAttestationHandler(client2, client2AttestationPromise);

    // spy on broadcastAttestation and propagate
    const broadcastAttestationSpy = jest.spyOn(p2pService1 as any, 'broadcastAttestation');
    const propagateSpy = jest.spyOn(p2pService1, 'propagate');

    // get the peer ID from the p2pService
    const mockSender = (clientsAndConfig[1].client as any).p2pService.node.peerId as PeerId;

    // process the block proposal
    await (p2pService1 as any).processValidBlockProposal(blockProposal, mockSender);

    // Wait a bit to ensure no messages would be sent
    await sleep(2000);

    // verify callback was called and attestations were created
    expect(mockCallback).toHaveBeenCalled();

    // verify broadcastAttestation and propagate were NOT called
    expect(broadcastAttestationSpy).not.toHaveBeenCalled();
    expect(propagateSpy).not.toHaveBeenCalled();

    // verify client2 did NOT receive any attestation
    expect(client2HandleGossipedAttestationSpy).not.toHaveBeenCalled();

    // Double-check the promise is still pending
    const client2Settled = await Promise.race([
      client2AttestationPromise.promise.then(() => 'resolved'),
      sleep(100).then(() => 'timeout'),
    ]);
    expect(client2Settled).toBe('timeout');
  });

  it('should broadcast attestations when fishermanMode is disabled', async () => {
    const numberOfNodes = 3;
    const mockGossipSubNetwork = new MockGossipSubNetwork();
    const testConfig: MakeTestP2PClientOptions = {
      p2pBaseConfig: { ...p2pBaseConfig, rollupVersion: 1, p2pDisableStatusHandshake: true },
      mockAttestationPool: attestationPool,
      mockTxPool: txPool,
      mockEpochCache: epochCache,
      mockWorldState: worldState,
      mockGossipSubNetwork,
      logger,
    };

    // All clients are NOT in fisherman mode
    const clientsAndConfig = await makeAndStartTestP2PClients(numberOfNodes, testConfig);
    clients = clientsAndConfig.map(c => c.client);
    const [client1, client2, client3] = clients;

    // Set up handlers on clients 2 and 3 to detect received attestations
    const client2AttestationPromise = promiseWithResolvers<BlockAttestation>();
    const client3AttestationPromise = promiseWithResolvers<BlockAttestation>();

    const client2HandleGossipedAttestationSpy = replaceBlockAttestationHandler(client2, client2AttestationPromise);
    const client3HandleGossipedAttestationSpy = replaceBlockAttestationHandler(client3, client3AttestationPromise);

    // Client 1 creates and broadcasts an attestation
    const dummyPayload: MakeConsensusPayloadOptions = {
      signer: Secp256k1Signer.random(),
      header: makeL2BlockHeader(),
      archive: Fr.random(),
      txHashes: [TxHash.random()],
    };
    const attestation = mockAttestation(
      Secp256k1Signer.random(),
      Number(dummyPayload.header!.getSlot()),
      dummyPayload.archive,
    );

    // Directly call broadcastAttestation (this is what happens when fishermanMode is false)
    await (client1 as any).p2pService.broadcastAttestation(attestation);

    // Wait for attestations to be received
    const messages = await retryUntil(
      async () => {
        const settled = await Promise.allSettled([
          client2AttestationPromise.promise,
          client3AttestationPromise.promise,
        ]);
        if (settled.every(s => s.status === 'fulfilled')) {
          return settled.map(s => (s as PromiseFulfilledResult<BlockAttestation>).value);
        }
        return undefined;
      },
      'attestations received by peers',
      10,
      0.5,
    );

    // Verify that clients 2 and 3 received the attestation
    expect(messages).toBeDefined();
    expect(client2HandleGossipedAttestationSpy).toHaveBeenCalled();
    expect(client3HandleGossipedAttestationSpy).toHaveBeenCalled();

    if (messages) {
      expect(messages[0].payload.toString()).toEqual(attestation.payload.toString());
      expect(messages[1].payload.toString()).toEqual(attestation.payload.toString());
    }
  });
});
