// Security levels for ARM TrustZone
export enum SecurityLevel {
  SECURE = 'secure',
  NON_SECURE = 'non-secure',
}

// Component types in the SoC
export enum ComponentType {
  ARM_CPU = 'ARM_CPU',
  NOC = 'NOC',
  CRYPTO = 'CRYPTO',
}

// State machine states
export enum ARMState {
  IDLE = 'IDLE',
  SECURE_MODE = 'SECURE_MODE',
  NON_SECURE_MODE = 'NON_SECURE_MODE',
  TRANSACTION_PENDING = 'TRANSACTION_PENDING',
}

export enum NOCState {
  IDLE = 'IDLE',
  ROUTING = 'ROUTING',
  CHECKING_SECURITY = 'CHECKING_SECURITY',
  FORWARDING = 'FORWARDING',
  BLOCKING = 'BLOCKING',
}

export enum CryptoState {
  IDLE = 'IDLE',
  CONFIG_LOCKED = 'CONFIG_LOCKED',
  CONFIG_UNLOCKED = 'CONFIG_UNLOCKED',
  PROCESSING = 'PROCESSING',
}

// Operation types
export enum OperationType {
  READ = 'read',
  WRITE = 'write',
  CONFIG = 'config',
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  ROUTING = 'ROUTING',
  CHECKING = 'CHECKING',
  SUCCESS = 'SUCCESS',
  DENIED = 'DENIED',
  ERROR = 'ERROR',
}

// Transaction request from frontend to backend
export interface TransactionRequest {
  type: 'transaction';
  id: string;
  source: ComponentType;
  destination: ComponentType;
  securityLevel: SecurityLevel;
  operation: OperationType;
  register?: string;
  value?: string;
  timestamp: string;
}

// Transaction result from backend to frontend
export interface TransactionResult {
  type: 'transaction_result';
  id: string;
  status: TransactionStatus;
  reason?: string;
  timestamp: string;
}

// Component state update
export interface ComponentStateUpdate {
  type: 'state_update';
  component: ComponentType;
  state: ARMState | NOCState | CryptoState;
  timestamp: string;
}

// Register update event
export interface RegisterUpdate {
  type: 'register_update';
  component: ComponentType;
  register: string;
  value: string;
  timestamp: string;
}

// Security violation event
export interface SecurityViolation {
  type: 'security_violation';
  transactionId: string;
  source: ComponentType;
  destination: ComponentType;
  reason: string;
  timestamp: string;
}

// Union type for all WebSocket messages
export type WebSocketMessage =
  | TransactionRequest
  | TransactionResult
  | ComponentStateUpdate
  | RegisterUpdate
  | SecurityViolation;

// Component state in the UI store
export interface ComponentState {
  component: ComponentType;
  state: ARMState | NOCState | CryptoState;
  registers: Record<string, string>;
}

// Transaction log entry
export interface TransactionLogEntry {
  id: string;
  source: ComponentType;
  destination: ComponentType;
  securityLevel: SecurityLevel;
  operation: OperationType;
  status: TransactionStatus;
  reason?: string;
  timestamp: string;
}

// Simulation state
export interface SimulationState {
  isConnected: boolean;
  isRunning: boolean;
  components: {
    [ComponentType.ARM_CPU]: ComponentState;
    [ComponentType.NOC]: ComponentState;
    [ComponentType.CRYPTO]: ComponentState;
  };
  transactionLog: TransactionLogEntry[];
  activeTransaction: string | null;
}
