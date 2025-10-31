import React from 'react';
import { Cpu, Shield, ShieldOff } from 'lucide-react';
import { ComponentType, ARMState, SecurityLevel } from '../types';
import { useSimulatorStore } from '../store/simulatorStore';
import clsx from 'clsx';

interface ARMCPUBlockProps {
  onTransactionRequest: (securityLevel: SecurityLevel) => void;
}

const stateColors = {
  [ARMState.IDLE]: 'bg-gray-500',
  [ARMState.SECURE_MODE]: 'bg-green-500',
  [ARMState.NON_SECURE_MODE]: 'bg-yellow-500',
  [ARMState.TRANSACTION_PENDING]: 'bg-blue-500',
};

export const ARMCPUBlock: React.FC<ARMCPUBlockProps> = ({ onTransactionRequest }) => {
  const component = useSimulatorStore((state) => state.components[ComponentType.ARM_CPU]);
  const isConnected = useSimulatorStore((state) => state.isConnected);

  return (
    <div className="relative">
      <div
        className={clsx(
          'w-64 h-48 rounded-lg border-4 transition-all duration-300 p-4',
          'flex flex-col items-center justify-center',
          stateColors[component.state as ARMState],
          'shadow-lg'
        )}
      >
        <Cpu className="w-16 h-16 text-white mb-2" />
        <h3 className="text-xl font-bold text-white mb-2">ARM CPU</h3>
        <p className="text-sm text-white opacity-90 mb-4">
          State: {component.state}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onTransactionRequest(SecurityLevel.SECURE)}
            disabled={!isConnected}
            className={clsx(
              'px-4 py-2 rounded-md font-medium transition-all',
              'flex items-center gap-2',
              isConnected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            )}
          >
            <Shield className="w-4 h-4" />
            Secure
          </button>
          <button
            onClick={() => onTransactionRequest(SecurityLevel.NON_SECURE)}
            disabled={!isConnected}
            className={clsx(
              'px-4 py-2 rounded-md font-medium transition-all',
              'flex items-center gap-2',
              isConnected
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            )}
          >
            <ShieldOff className="w-4 h-4" />
            Non-Secure
          </button>
        </div>
      </div>
    </div>
  );
};
