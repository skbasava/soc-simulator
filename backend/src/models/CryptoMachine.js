import { StateMachine } from './StateMachine.js';

/**
 * Crypto Block State Machine
 * Models cryptographic hardware with security-aware configuration
 */
export class CryptoMachine extends StateMachine {
  constructor(eventBus) {
    super('CRYPTO', 'CONFIG_LOCKED');
    this.eventBus = eventBus;
    this.registers = {
      CONFIG_REG_0: '0x00000000',
      CONFIG_REG_1: '0x00000000',
      DATA_REG_0: '0x00000000',
    };
    this.setupTransitions();
    this.setupStateHandlers();
  }

  setupTransitions() {
    // From CONFIG_LOCKED
    this.addTransition('CONFIG_LOCKED', 'UNLOCK_CONFIG', 'CONFIG_UNLOCKED');
    this.addTransition('CONFIG_LOCKED', 'PROCESS_DATA', 'PROCESSING');

    // From CONFIG_UNLOCKED
    this.addTransition('CONFIG_UNLOCKED', 'LOCK_CONFIG', 'CONFIG_LOCKED');
    this.addTransition('CONFIG_UNLOCKED', 'WRITE_CONFIG', 'CONFIG_UNLOCKED');
    this.addTransition('CONFIG_UNLOCKED', 'PROCESS_DATA', 'PROCESSING');

    // From PROCESSING
    this.addTransition('PROCESSING', 'COMPLETE', 'CONFIG_LOCKED');

    // From any state, can go to IDLE for reset
    this.addTransition('CONFIG_LOCKED', 'RESET', 'CONFIG_LOCKED');
    this.addTransition('CONFIG_UNLOCKED', 'RESET', 'CONFIG_LOCKED');
    this.addTransition('PROCESSING', 'RESET', 'CONFIG_LOCKED');
  }

  setupStateHandlers() {
    this.onEnterState('CONFIG_LOCKED', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'CRYPTO',
        state: 'CONFIG_LOCKED',
        timestamp: new Date().toISOString(),
      });
    });

    this.onEnterState('CONFIG_UNLOCKED', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'CRYPTO',
        state: 'CONFIG_UNLOCKED',
        timestamp: new Date().toISOString(),
      });

      // If we have a write operation, perform it
      if (data.transaction && data.transaction.operation === 'write') {
        this.writeRegister(data.transaction);
      }

      // Auto-lock after write
      setTimeout(() => this.send('LOCK_CONFIG'), 100);
    });

    this.onEnterState('PROCESSING', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'CRYPTO',
        state: 'PROCESSING',
        timestamp: new Date().toISOString(),
      });

      // Simulate processing
      if (data.transaction) {
        if (data.transaction.operation === 'write') {
          this.writeRegister(data.transaction);
        } else if (data.transaction.operation === 'read') {
          this.readRegister(data.transaction);
        }
      }

      // Complete processing
      setTimeout(() => this.send('COMPLETE'), 100);
    });
  }

  /**
   * Process a transaction
   */
  async processTransaction(transaction) {
    const isConfigRegister = transaction.register?.startsWith('CONFIG_REG');
    const isWrite = transaction.operation === 'write';

    if (isConfigRegister && isWrite) {
      // Writing to config register - need to unlock first
      await this.send('UNLOCK_CONFIG', { transaction });
    } else {
      // Data register access or read operation
      await this.send('PROCESS_DATA', { transaction });
    }
  }

  /**
   * Write to a register
   */
  writeRegister(transaction) {
    const { register, value } = transaction;

    if (this.registers.hasOwnProperty(register)) {
      this.registers[register] = value;

      this.eventBus.emit('register_update', {
        type: 'register_update',
        component: 'CRYPTO',
        register,
        value,
        timestamp: new Date().toISOString(),
      });

      this.eventBus.emit('transaction_result', {
        type: 'transaction_result',
        id: transaction.id,
        status: 'SUCCESS',
        reason: `Successfully wrote ${value} to ${register}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Read from a register
   */
  readRegister(transaction) {
    const { register } = transaction;

    if (this.registers.hasOwnProperty(register)) {
      const value = this.registers[register];

      this.eventBus.emit('transaction_result', {
        type: 'transaction_result',
        id: transaction.id,
        status: 'SUCCESS',
        reason: `Read ${value} from ${register}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all registers
   */
  getRegisters() {
    return { ...this.registers };
  }
}
