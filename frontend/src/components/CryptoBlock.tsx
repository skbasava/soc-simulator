import React from 'react';
import { Lock } from 'lucide-react';
import { ComponentType, CryptoState } from '../types';
import { useSimulatorStore } from '../store/simulatorStore';
import clsx from 'clsx';

const stateColors = {
  [CryptoState.IDLE]: 'bg-gray-500',
  [CryptoState.CONFIG_LOCKED]: 'bg-red-500',
  [CryptoState.CONFIG_UNLOCKED]: 'bg-green-500',
  [CryptoState.PROCESSING]: 'bg-blue-500',
};

export const CryptoBlock: React.FC = () => {
  const component = useSimulatorStore((state) => state.components[ComponentType.CRYPTO]);

  return (
    <div className="relative">
      <div
        className={clsx(
          'w-64 h-48 rounded-lg border-4 transition-all duration-300 p-4',
          'flex flex-col items-center justify-center',
          stateColors[component.state as CryptoState],
          'shadow-lg'
        )}
      >
        <Lock className="w-16 h-16 text-white mb-2" />
        <h3 className="text-xl font-bold text-white mb-2">Crypto Block</h3>
        <p className="text-sm text-white opacity-90 mb-3">
          State: {component.state}
        </p>

        <div className="bg-white bg-opacity-20 rounded p-2 w-full">
          <p className="text-xs text-white font-bold mb-1">Registers:</p>
          {Object.entries(component.registers).map(([key, value]) => (
            <p key={key} className="text-xs text-white opacity-90 font-mono">
              {key}: {value}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
