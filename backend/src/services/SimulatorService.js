import { EventBus } from './EventBus.js';
import { ARMCPUMachine } from '../models/ARMCPUMachine.js';
import { NOCMachine } from '../models/NOCMachine.js';
import { CryptoMachine } from '../models/CryptoMachine.js';

/**
 * Main simulator service that orchestrates all state machines
 */
export class SimulatorService {
  constructor() {
    this.eventBus = new EventBus();
    this.isRunning = false;

    // Initialize state machines
    this.armCPU = new ARMCPUMachine(this.eventBus);
    this.noc = new NOCMachine(this.eventBus);
    this.crypto = new CryptoMachine(this.eventBus);

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for inter-machine communication
   */
  setupEventHandlers() {
    // NOC receives transactions from ARM CPU
    this.eventBus.on('noc_transaction', async (transaction) => {
      console.log('[Simulator] NOC receiving transaction:', transaction.id);
      await this.noc.receiveTransaction(transaction);
    });

    // Crypto receives transactions from NOC (after security check)
    this.eventBus.on('crypto_transaction', async (transaction) => {
      console.log('[Simulator] Crypto receiving transaction:', transaction.id);
      await this.crypto.processTransaction(transaction);
    });

    // Transaction complete - notify ARM CPU
    this.eventBus.on('transaction_result', async (result) => {
      console.log('[Simulator] Transaction result:', result.id, result.status);
      await this.armCPU.completeTransaction(result.status === 'SUCCESS');
    });
  }

  /**
   * Handle incoming transaction from client
   */
  async handleTransaction(transaction) {
    if (!this.isRunning) {
      console.warn('[Simulator] Received transaction but simulator is not running');
      return;
    }

    console.log('[Simulator] Processing transaction:', transaction);

    try {
      await this.armCPU.initiateTransaction(transaction);
    } catch (error) {
      console.error('[Simulator] Error processing transaction:', error);
      this.eventBus.emit('transaction_result', {
        type: 'transaction_result',
        id: transaction.id,
        status: 'ERROR',
        reason: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Start the simulation
   */
  start() {
    console.log('[Simulator] Starting simulation');
    this.isRunning = true;
    return { status: 'started' };
  }

  /**
   * Stop the simulation
   */
  stop() {
    console.log('[Simulator] Stopping simulation');
    this.isRunning = false;
    return { status: 'stopped' };
  }

  /**
   * Reset the simulation
   */
  reset() {
    console.log('[Simulator] Resetting simulation');
    this.armCPU.reset('IDLE');
    this.noc.reset('IDLE');
    this.crypto.reset('CONFIG_LOCKED');
    this.isRunning = false;
    return { status: 'reset' };
  }

  /**
   * Get current state of all components
   */
  getState() {
    return {
      isRunning: this.isRunning,
      components: {
        ARM_CPU: {
          state: this.armCPU.getState(),
          securityLevel: this.armCPU.currentSecurityLevel,
        },
        NOC: {
          state: this.noc.getState(),
        },
        CRYPTO: {
          state: this.crypto.getState(),
          registers: this.crypto.getRegisters(),
        },
      },
    };
  }

  /**
   * Subscribe to events
   */
  subscribe(callback) {
    this.eventBus.subscribeToAll(callback);
  }
}
