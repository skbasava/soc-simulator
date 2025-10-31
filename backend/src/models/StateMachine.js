/**
 * Base State Machine class
 * Implements a simple state machine pattern that mirrors P# concepts
 */
export class StateMachine {
  constructor(name, initialState) {
    this.name = name;
    this.currentState = initialState;
    this.transitions = new Map();
    this.stateHandlers = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Define a state transition
   * @param {string} fromState - Source state
   * @param {string} event - Event that triggers transition
   * @param {string} toState - Target state
   * @param {Function} guard - Optional guard function
   */
  addTransition(fromState, event, toState, guard = null) {
    const key = `${fromState}:${event}`;
    this.transitions.set(key, { toState, guard });
  }

  /**
   * Define a handler for entering a state
   * @param {string} state - State name
   * @param {Function} handler - Handler function
   */
  onEnterState(state, handler) {
    this.stateHandlers.set(state, handler);
  }

  /**
   * Send an event to the state machine
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  async send(event, data = {}) {
    this.eventQueue.push({ event, data });
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process the event queue
   */
  async processQueue() {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift();
      await this.handleEvent(event, data);
    }

    this.isProcessing = false;
  }

  /**
   * Handle a single event
   */
  async handleEvent(event, data) {
    const key = `${this.currentState}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      console.log(
        `No transition for ${this.name}: ${this.currentState} -[${event}]-> ?`
      );
      return;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(data)) {
      console.log(`Guard failed for transition: ${key}`);
      return;
    }

    const oldState = this.currentState;
    this.currentState = transition.toState;

    console.log(
      `[${this.name}] State transition: ${oldState} -[${event}]-> ${this.currentState}`
    );

    // Call state entry handler
    const handler = this.stateHandlers.get(this.currentState);
    if (handler) {
      await handler(data);
    }
  }

  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Reset to initial state
   */
  reset(initialState) {
    this.currentState = initialState;
    this.eventQueue = [];
    this.isProcessing = false;
  }
}
