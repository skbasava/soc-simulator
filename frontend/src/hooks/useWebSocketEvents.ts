import { useEffect } from 'react';
import { wsService } from '../services/websocket';
import { useSimulatorStore } from '../store/simulatorStore';
import type { WebSocketMessage } from '../types';

export const useWebSocketEvents = () => {
  const updateComponentState = useSimulatorStore((state) => state.updateComponentState);
  const updateRegister = useSimulatorStore((state) => state.updateRegister);
  const updateTransactionStatus = useSimulatorStore(
    (state) => state.updateTransactionStatus
  );
  const handleSecurityViolation = useSimulatorStore(
    (state) => state.handleSecurityViolation
  );

  useEffect(() => {
    const unsubscribe = wsService.on('*', (message: WebSocketMessage) => {
      console.log('Received message:', message);

      switch (message.type) {
        case 'state_update':
          updateComponentState(message);
          break;

        case 'register_update':
          updateRegister(message);
          break;

        case 'transaction_result':
          updateTransactionStatus(message);
          break;

        case 'security_violation':
          handleSecurityViolation(message);
          break;
      }
    });

    return () => unsubscribe();
  }, [
    updateComponentState,
    updateRegister,
    updateTransactionStatus,
    handleSecurityViolation,
  ]);
};
