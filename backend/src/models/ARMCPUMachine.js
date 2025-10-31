import { StateMachine } from './StateMachine.js';

/**
 * ARM CPU State Machine
 * Models the ARM processor with TrustZone security states
 */
export class ARMCPUMachine extends StateMachine {
  constructor(eventBus) {
    super('ARM_CPU', 'IDLE');
    this.eventBus = eventBus;
    this.currentSecurityLevel = null;
    this.setupTransitions();
    this.setupStateHandlers();
  }

  setupTransitions() {
    // From IDLE
    this.addTransition('IDLE', 'SECURE_TRANSACTION', 'SECURE_MODE');
    this.addTransition('IDLE', 'NON_SECURE_TRANSACTION', 'NON_SECURE_MODE');

    // From SECURE_MODE
    this.addTransition('SECURE_MODE', 'SEND_TRANSACTION', 'TRANSACTION_PENDING');
    this.addTransition('SECURE_MODE', 'RETURN_IDLE', 'IDLE');

    // From NON_SECURE_MODE
    this.addTransition('NON_SECURE_MODE', 'SEND_TRANSACTION', 'TRANSACTION_PENDING');
    this.addTransition('NON_SECURE_MODE', 'RETURN_IDLE', 'IDLE');

    // From TRANSACTION_PENDING
    this.addTransition('TRANSACTION_PENDING', 'TRANSACTION_COMPLETE', 'IDLE');
    this.addTransition('TRANSACTION_PENDING', 'TRANSACTION_DENIED', 'IDLE');
  }

  setupStateHandlers() {
    this.onEnterState('SECURE_MODE', async (data) => {
      this.currentSecurityLevel = 'secure';
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'ARM_CPU',
        state: 'SECURE_MODE',
        timestamp: new Date().toISOString(),
      });
    });

    this.onEnterState('NON_SECURE_MODE', async (data) => {
      this.currentSecurityLevel = 'non-secure';
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'ARM_CPU',
        state: 'NON_SECURE_MODE',
        timestamp: new Date().toISOString(),
      });
    });

    this.onEnterState('TRANSACTION_PENDING', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'ARM_CPU',
        state: 'TRANSACTION_PENDING',
        timestamp: new Date().toISOString(),
      });

      // Forward transaction to NOC
      this.eventBus.emit('noc_transaction', {
        ...data.transaction,
        securityLevel: this.currentSecurityLevel,
      });
    });

    this.onEnterState('IDLE', async (data) => {
      this.currentSecurityLevel = null;
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'ARM_CPU',
        state: 'IDLE',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Initiate a transaction
   */
  async initiateTransaction(transaction) {
    // First, enter the appropriate security mode
    const event =
      transaction.securityLevel === 'secure'
        ? 'SECURE_TRANSACTION'
        : 'NON_SECURE_TRANSACTION';

    await this.send(event, { transaction });

    // Then send the transaction
    await this.send('SEND_TRANSACTION', { transaction });
  }

  /**
   * Complete a transaction
   */
  async completeTransaction(success) {
    const event = success ? 'TRANSACTION_COMPLETE' : 'TRANSACTION_DENIED';
    await this.send(event);
  }
}
