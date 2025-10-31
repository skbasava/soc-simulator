import { EventEmitter } from 'events';

/**
 * Event Bus for inter-machine communication
 * Acts as a mediator between state machines and the WebSocket server
 */
export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase listener limit for multiple machines
  }

  /**
   * Subscribe to all events for logging/debugging
   */
  subscribeToAll(callback) {
    const events = [
      'state_update',
      'transaction_result',
      'register_update',
      'security_violation',
      'noc_transaction',
      'crypto_transaction',
    ];

    events.forEach((event) => {
      this.on(event, (data) => {
        console.log(`[EventBus] ${event}:`, data);
        callback(event, data);
      });
    });
  }
}
