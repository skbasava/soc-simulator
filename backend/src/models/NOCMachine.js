import { StateMachine } from './StateMachine.js';

/**
 * Network on Chip (NOC) State Machine
 * Handles transaction routing and security policy enforcement
 */
export class NOCMachine extends StateMachine {
  constructor(eventBus) {
    super('NOC', 'IDLE');
    this.eventBus = eventBus;
    this.currentTransaction = null;
    this.setupTransitions();
    this.setupStateHandlers();
  }

  setupTransitions() {
    // From IDLE
    this.addTransition('IDLE', 'RECEIVE_TRANSACTION', 'ROUTING');

    // From ROUTING
    this.addTransition('ROUTING', 'CHECK_SECURITY', 'CHECKING_SECURITY');

    // From CHECKING_SECURITY
    this.addTransition(
      'CHECKING_SECURITY',
      'SECURITY_OK',
      'FORWARDING',
      (data) => data.securityCheckPassed === true
    );
    this.addTransition(
      'CHECKING_SECURITY',
      'SECURITY_DENIED',
      'BLOCKING',
      (data) => data.securityCheckPassed === false
    );

    // From FORWARDING
    this.addTransition('FORWARDING', 'FORWARD_COMPLETE', 'IDLE');

    // From BLOCKING
    this.addTransition('BLOCKING', 'BLOCK_COMPLETE', 'IDLE');
  }

  setupStateHandlers() {
    this.onEnterState('ROUTING', async (data) => {
      this.currentTransaction = data.transaction;
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'NOC',
        state: 'ROUTING',
        timestamp: new Date().toISOString(),
      });

      // Automatically proceed to security check
      await this.send('CHECK_SECURITY');
    });

    this.onEnterState('CHECKING_SECURITY', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'NOC',
        state: 'CHECKING_SECURITY',
        timestamp: new Date().toISOString(),
      });

      // Perform security check
      const securityCheckPassed = this.checkSecurityPolicy(this.currentTransaction);

      // Send appropriate event based on security check
      const event = securityCheckPassed ? 'SECURITY_OK' : 'SECURITY_DENIED';
      await this.send(event, { securityCheckPassed });
    });

    this.onEnterState('FORWARDING', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'NOC',
        state: 'FORWARDING',
        timestamp: new Date().toISOString(),
      });

      // Forward to destination (Crypto block)
      this.eventBus.emit('crypto_transaction', this.currentTransaction);

      // Complete forwarding
      await this.send('FORWARD_COMPLETE');
    });

    this.onEnterState('BLOCKING', async (data) => {
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'NOC',
        state: 'BLOCKING',
        timestamp: new Date().toISOString(),
      });

      // Emit security violation
      this.eventBus.emit('security_violation', {
        type: 'security_violation',
        transactionId: this.currentTransaction.id,
        source: this.currentTransaction.source,
        destination: this.currentTransaction.destination,
        reason: this.getSecurityViolationReason(this.currentTransaction),
        timestamp: new Date().toISOString(),
      });

      // Send transaction denied result
      this.eventBus.emit('transaction_result', {
        type: 'transaction_result',
        id: this.currentTransaction.id,
        status: 'DENIED',
        reason: this.getSecurityViolationReason(this.currentTransaction),
        timestamp: new Date().toISOString(),
      });

      // Complete blocking
      await this.send('BLOCK_COMPLETE');
    });

    this.onEnterState('IDLE', async (data) => {
      this.currentTransaction = null;
      this.eventBus.emit('state_update', {
        type: 'state_update',
        component: 'NOC',
        state: 'IDLE',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Check security policy for a transaction
   */
  checkSecurityPolicy(transaction) {
    // Security rules:
    // 1. Writing to CONFIG registers requires secure mode
    // 2. Reading CONFIG registers requires secure mode
    // 3. Writing/reading DATA registers is allowed in non-secure mode

    const isConfigRegister = transaction.register?.startsWith('CONFIG_REG');
    const isWriteOperation = transaction.operation === 'write';
    const isSecure = transaction.securityLevel === 'secure';

    if (isConfigRegister) {
      // Config registers always require secure access
      return isSecure;
    }

    // Data registers can be accessed in non-secure mode
    return true;
  }

  /**
   * Get security violation reason
   */
  getSecurityViolationReason(transaction) {
    const isConfigRegister = transaction.register?.startsWith('CONFIG_REG');

    if (isConfigRegister && transaction.securityLevel === 'non-secure') {
      return `Security violation: Non-secure access to secure register ${transaction.register}`;
    }

    return 'Security policy violation';
  }

  /**
   * Receive a transaction from ARM CPU
   */
  async receiveTransaction(transaction) {
    await this.send('RECEIVE_TRANSACTION', { transaction });
  }
}
