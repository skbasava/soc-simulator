import React from 'react';
import { Network } from 'lucide-react';
import { ComponentType, NOCState } from '../types';
import { useSimulatorStore } from '../store/simulatorStore';
import clsx from 'clsx';

const stateColors = {
  [NOCState.IDLE]: 'bg-gray-500',
  [NOCState.ROUTING]: 'bg-blue-400',
  [NOCState.CHECKING_SECURITY]: 'bg-purple-500',
  [NOCState.FORWARDING]: 'bg-green-400',
  [NOCState.BLOCKING]: 'bg-red-500',
};

export const NOCBlock: React.FC = () => {
  const component = useSimulatorStore((state) => state.components[ComponentType.NOC]);

  return (
    <div className="relative">
      <div
        className={clsx(
          'w-64 h-48 rounded-lg border-4 transition-all duration-300 p-4',
          'flex flex-col items-center justify-center',
          stateColors[component.state as NOCState],
          'shadow-lg'
        )}
      >
        <Network className="w-16 h-16 text-white mb-2" />
        <h3 className="text-xl font-bold text-white mb-2">Network on Chip</h3>
        <p className="text-sm text-white opacity-90">State: {component.state}</p>
        <p className="text-xs text-white opacity-75 mt-2 text-center">
          Routes transactions and enforces security policies
        </p>
      </div>
    </div>
  );
};
