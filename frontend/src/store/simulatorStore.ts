import { create } from 'zustand';
import {
  SimulationState,
  ComponentType,
  ARMState,
  NOCState,
  CryptoState,
  TransactionLogEntry,
  TransactionResult,
  ComponentStateUpdate,
  RegisterUpdate,
  SecurityViolation,
} from '../types';

interface SimulatorStore extends SimulationState {
  // Actions
  setConnected: (connected: boolean) => void;
  setRunning: (running: boolean) => void;
  updateComponentState: (update: ComponentStateUpdate) => void;
  updateRegister: (update: RegisterUpdate) => void;
  addTransactionLog: (entry: TransactionLogEntry) => void;
  updateTransactionStatus: (result: TransactionResult) => void;
  handleSecurityViolation: (violation: SecurityViolation) => void;
  setActiveTransaction: (id: string | null) => void;
  clearLogs: () => void;
  reset: () => void;
}

const initialState: SimulationState = {
  isConnected: false,
  isRunning: false,
  components: {
    [ComponentType.ARM_CPU]: {
      component: ComponentType.ARM_CPU,
      state: ARMState.IDLE,
      registers: {},
    },
    [ComponentType.NOC]: {
      component: ComponentType.NOC,
      state: NOCState.IDLE,
      registers: {},
    },
    [ComponentType.CRYPTO]: {
      component: ComponentType.CRYPTO,
      state: CryptoState.CONFIG_LOCKED,
      registers: {
        CONFIG_REG_0: '0x00000000',
        CONFIG_REG_1: '0x00000000',
        DATA_REG_0: '0x00000000',
      },
    },
  },
  transactionLog: [],
  activeTransaction: null,
};

export const useSimulatorStore = create<SimulatorStore>((set) => ({
  ...initialState,

  setConnected: (connected) => set({ isConnected: connected }),

  setRunning: (running) => set({ isRunning: running }),

  updateComponentState: (update) =>
    set((state) => ({
      components: {
        ...state.components,
        [update.component]: {
          ...state.components[update.component],
          state: update.state,
        },
      },
    })),

  updateRegister: (update) =>
    set((state) => ({
      components: {
        ...state.components,
        [update.component]: {
          ...state.components[update.component],
          registers: {
            ...state.components[update.component].registers,
            [update.register]: update.value,
          },
        },
      },
    })),

  addTransactionLog: (entry) =>
    set((state) => ({
      transactionLog: [entry, ...state.transactionLog].slice(0, 100), // Keep last 100
    })),

  updateTransactionStatus: (result) =>
    set((state) => ({
      transactionLog: state.transactionLog.map((entry) =>
        entry.id === result.id
          ? { ...entry, status: result.status, reason: result.reason }
          : entry
      ),
      activeTransaction:
        state.activeTransaction === result.id ? null : state.activeTransaction,
    })),

  handleSecurityViolation: (violation) =>
    set((state) => ({
      transactionLog: state.transactionLog.map((entry) =>
        entry.id === violation.transactionId
          ? { ...entry, status: 'DENIED' as const, reason: violation.reason }
          : entry
      ),
    })),

  setActiveTransaction: (id) => set({ activeTransaction: id }),

  clearLogs: () => set({ transactionLog: [] }),

  reset: () => set(initialState),
}));
