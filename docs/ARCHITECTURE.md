# ARM SoC Simulator - Architecture Documentation

## System Architecture

### High-Level Overview

The ARM SoC Simulator is a distributed system with a clear separation between presentation (frontend) and business logic (backend).

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│                      (React Frontend)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Block      │  │  Transaction │  │   Control    │    │
│  │   Diagram    │  │     Log      │  │    Panel     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │           WebSocket Client Service                  │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                    WebSocket Protocol
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Communication Layer                        │
│                   (Socket.IO Server)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │                  Event Bus                          │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│                    (State Machines)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     ARM      │  │     NOC      │  │    Crypto    │    │
│  │     CPU      │  │   Machine    │  │   Machine    │    │
│  │   Machine    │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │            Simulator Service                        │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Architecture

#### 1. Component Hierarchy

```
App
├── useWebSocketEvents (hook)
├── Header
├── ControlPanel
│   ├── Connection controls
│   └── Simulation controls
├── BlockDiagram
│   ├── ARMCPUBlock
│   ├── NOCBlock
│   ├── CryptoBlock
│   └── TransactionModal
└── TransactionLog
```

#### 2. State Management (Zustand)

**Store Structure**:
```typescript
{
  isConnected: boolean,
  isRunning: boolean,
  components: {
    ARM_CPU: { state, registers },
    NOC: { state, registers },
    CRYPTO: { state, registers }
  },
  transactionLog: TransactionLogEntry[],
  activeTransaction: string | null
}
```

**Actions**:
- `setConnected()`
- `updateComponentState()`
- `updateRegister()`
- `addTransactionLog()`
- `updateTransactionStatus()`
- `handleSecurityViolation()`
- `reset()`

#### 3. WebSocket Client Service

**Responsibilities**:
- Establish and maintain WebSocket connection
- Send transaction requests
- Receive and route events
- Handle reconnection logic

**Event Flow**:
```
User Action → Store Action → WebSocket.send() → Backend
Backend → WebSocket.on() → Store Update → UI Re-render
```

### Backend Architecture

#### 1. State Machine Pattern

**Base StateMachine Class**:
```javascript
class StateMachine {
  - currentState
  - transitions: Map<key, {toState, guard}>
  - stateHandlers: Map<state, handler>
  - eventQueue: []

  + addTransition(from, event, to, guard?)
  + onEnterState(state, handler)
  + send(event, data)
  + handleEvent(event, data)
}
```

**Characteristics**:
- Event queue for deterministic processing
- Guard conditions for conditional transitions
- State entry handlers for side effects
- Inspired by P language semantics

#### 2. Component State Machines

##### ARM CPU Machine

**States**:
- `IDLE`: No active operation
- `SECURE_MODE`: TrustZone secure world
- `NON_SECURE_MODE`: TrustZone non-secure world
- `TRANSACTION_PENDING`: Waiting for response

**Transitions**:
```
IDLE --[SECURE_TRANSACTION]--> SECURE_MODE
IDLE --[NON_SECURE_TRANSACTION]--> NON_SECURE_MODE
SECURE_MODE --[SEND_TRANSACTION]--> TRANSACTION_PENDING
NON_SECURE_MODE --[SEND_TRANSACTION]--> TRANSACTION_PENDING
TRANSACTION_PENDING --[TRANSACTION_COMPLETE]--> IDLE
TRANSACTION_PENDING --[TRANSACTION_DENIED]--> IDLE
```

##### NOC Machine

**States**:
- `IDLE`: Ready for transactions
- `ROUTING`: Determining route
- `CHECKING_SECURITY`: Validating policy
- `FORWARDING`: Approved, forwarding
- `BLOCKING`: Denied, blocking

**Security Policy**:
```javascript
checkSecurityPolicy(transaction) {
  if (transaction.register.startsWith('CONFIG_')) {
    return transaction.securityLevel === 'secure';
  }
  return true; // Data registers allowed
}
```

##### Crypto Machine

**States**:
- `CONFIG_LOCKED`: Config registers locked
- `CONFIG_UNLOCKED`: Temporarily unlocked for writes
- `PROCESSING`: Processing operation

**Register Model**:
```javascript
registers = {
  CONFIG_REG_0: '0x00000000',  // Requires secure
  CONFIG_REG_1: '0x00000000',  // Requires secure
  DATA_REG_0: '0x00000000'     // Non-secure OK
}
```

#### 3. Event Bus

**Purpose**: Decouple state machines

**Events**:
- `noc_transaction`: ARM CPU → NOC
- `crypto_transaction`: NOC → Crypto
- `transaction_result`: Crypto → ARM CPU
- `state_update`: Any → Frontend
- `register_update`: Crypto → Frontend
- `security_violation`: NOC → Frontend

**Pattern**: Publish-Subscribe

#### 4. Simulator Service

**Responsibilities**:
- Instantiate and wire state machines
- Route inter-machine events
- Handle WebSocket requests
- Maintain simulation state

### Communication Protocol

#### Message Types

1. **Transaction Request** (Client → Server):
```json
{
  "type": "transaction",
  "id": "txn-123",
  "source": "ARM_CPU",
  "destination": "CRYPTO",
  "securityLevel": "secure",
  "operation": "write",
  "register": "CONFIG_REG_0",
  "value": "0xDEADBEEF",
  "timestamp": "2025-10-30T10:30:45Z"
}
```

2. **State Update** (Server → Client):
```json
{
  "type": "state_update",
  "component": "ARM_CPU",
  "state": "SECURE_MODE",
  "timestamp": "2025-10-30T10:30:45Z"
}
```

3. **Transaction Result** (Server → Client):
```json
{
  "type": "transaction_result",
  "id": "txn-123",
  "status": "SUCCESS",
  "reason": "Successfully wrote...",
  "timestamp": "2025-10-30T10:30:45Z"
}
```

4. **Security Violation** (Server → Client):
```json
{
  "type": "security_violation",
  "transactionId": "txn-123",
  "source": "ARM_CPU",
  "destination": "CRYPTO",
  "reason": "Non-secure access to secure register",
  "timestamp": "2025-10-30T10:30:45Z"
}
```

## Transaction Flow

### Successful Secure Transaction

```
1. User clicks "Secure" on ARM CPU
   └─> Frontend: Show modal

2. User selects "Write Config Register"
   └─> Frontend: Generate transaction ID
   └─> Frontend: Send transaction via WebSocket
   └─> Frontend: Add to log with PENDING status

3. Backend: Receive transaction
   └─> SimulatorService.handleTransaction()
   └─> ARMCPUMachine.initiateTransaction()
       ├─> State: IDLE → SECURE_MODE
       │   └─> Emit: state_update (SECURE_MODE)
       └─> State: SECURE_MODE → TRANSACTION_PENDING
           └─> Emit: noc_transaction

4. NOCMachine.receiveTransaction()
   ├─> State: IDLE → ROUTING
   │   └─> Emit: state_update (ROUTING)
   ├─> State: ROUTING → CHECKING_SECURITY
   │   └─> Emit: state_update (CHECKING_SECURITY)
   ├─> Check: isSecure && isConfigReg → PASS
   └─> State: CHECKING_SECURITY → FORWARDING
       ├─> Emit: state_update (FORWARDING)
       └─> Emit: crypto_transaction

5. CryptoMachine.processTransaction()
   ├─> State: CONFIG_LOCKED → CONFIG_UNLOCKED
   │   └─> Emit: state_update (CONFIG_UNLOCKED)
   ├─> Write register
   │   └─> Emit: register_update
   ├─> Emit: transaction_result (SUCCESS)
   └─> State: CONFIG_UNLOCKED → CONFIG_LOCKED

6. ARMCPUMachine.completeTransaction()
   └─> State: TRANSACTION_PENDING → IDLE
       └─> Emit: state_update (IDLE)

7. Frontend: Receive all events
   └─> Update store
   └─> Re-render UI
   └─> Show SUCCESS in log
```

### Failed Non-Secure Transaction

```
1-3. Same as above, but securityLevel = "non-secure"

4. NOCMachine.receiveTransaction()
   ├─> State: IDLE → ROUTING → CHECKING_SECURITY
   ├─> Check: !isSecure && isConfigReg → FAIL
   └─> State: CHECKING_SECURITY → BLOCKING
       ├─> Emit: state_update (BLOCKING)
       ├─> Emit: security_violation
       ├─> Emit: transaction_result (DENIED)
       └─> State: BLOCKING → IDLE

5. ARMCPUMachine receives DENIED
   └─> State: TRANSACTION_PENDING → IDLE

6. Frontend: Show DENIED with security violation
```

## Design Patterns

### 1. State Machine Pattern
- **Purpose**: Model complex component behavior
- **Benefits**: Deterministic, testable, formal verification potential

### 2. Event Bus Pattern
- **Purpose**: Decouple state machines
- **Benefits**: Loose coupling, extensibility

### 3. Repository Pattern (Store)
- **Purpose**: Centralize state management
- **Benefits**: Single source of truth, predictable updates

### 4. Service Layer Pattern
- **Purpose**: Orchestrate business logic
- **Benefits**: Clear responsibilities, testability

### 5. Observer Pattern (WebSocket)
- **Purpose**: Real-time updates
- **Benefits**: Reactive UI, efficient communication

## Security Model

### TrustZone Simulation

**Secure World**:
- Full access to all registers
- Can modify configuration
- Can execute privileged operations

**Non-Secure World**:
- Limited access to sensitive registers
- Cannot modify security configuration
- Standard operations only

### Access Control Matrix

| Register       | Secure Read | Secure Write | Non-Secure Read | Non-Secure Write |
|----------------|-------------|--------------|-----------------|------------------|
| CONFIG_REG_0   | ✓           | ✓            | ✗               | ✗                |
| CONFIG_REG_1   | ✓           | ✓            | ✗               | ✗                |
| DATA_REG_0     | ✓           | ✓            | ✓               | ✓                |

### Security Enforcement Points

1. **ARM CPU**: Sets security context
2. **NOC**: Enforces security policy (primary enforcement)
3. **Crypto Block**: Validates operations (secondary enforcement)

## Scalability Considerations

### Current Design

- Single-instance backend
- In-memory state
- WebSocket for real-time updates

### Future Scaling

**Horizontal Scaling**:
- Redis for shared state
- Redis Pub/Sub for event bus
- Load balancer for multiple backend instances

**Persistence**:
- PostgreSQL for audit logs
- Time-series DB for metrics

**Microservices**:
- Separate services per component
- gRPC for inter-service communication

## Testing Strategy

### Unit Tests
- State machine transitions
- Security policy logic
- Event routing

### Integration Tests
- End-to-end transaction flows
- WebSocket communication
- Error handling

### Property-Based Tests (with P)
- Safety properties (no unauthorized access)
- Liveness properties (transactions complete)
- Formal verification

## Performance Characteristics

### Latency
- WebSocket message: < 10ms
- State transition: < 1ms
- End-to-end transaction: < 50ms

### Throughput
- 100+ transactions/second
- Limited by event queue processing

### Memory
- Frontend: ~100MB (includes Vite dev server)
- Backend: ~50MB (Node.js base + state machines)

## Error Handling

### Frontend
- WebSocket reconnection with exponential backoff
- User-friendly error messages
- Transaction timeout handling

### Backend
- Try-catch blocks around state transitions
- Graceful degradation
- Comprehensive logging

## Monitoring & Debugging

### Logging
- Console.log for all state transitions
- WebSocket event logging
- Transaction lifecycle logging

### Debugging
- Browser DevTools for frontend
- Node.js inspector for backend
- WebSocket message inspection

## Future Architecture Enhancements

1. **P# Runtime Integration**:
   - Replace JS state machines with compiled P# code
   - Formal verification of properties

2. **Distributed Architecture**:
   - Microservices per component
   - Event sourcing for audit trail

3. **Performance Optimization**:
   - Binary protocol (instead of JSON)
   - Connection pooling
   - Caching layer

4. **Advanced Security**:
   - User authentication
   - Role-based access control
   - Encrypted communication (WSS)

---

This architecture provides a solid foundation for a hardware simulation system with formal modeling capabilities and real-time visualization.
