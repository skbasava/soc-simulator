import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ARMCPUBlock } from './ARMCPUBlock';
import { NOCBlock } from './NOCBlock';
import { CryptoBlock } from './CryptoBlock';
import { SecurityLevel, ComponentType, OperationType } from '../types';
import { wsService } from '../services/websocket';
import { useSimulatorStore } from '../store/simulatorStore';
import clsx from 'clsx';

export const BlockDiagram: React.FC = () => {
  const [selectedSecurity, setSelectedSecurity] = useState<SecurityLevel>(
    SecurityLevel.SECURE
  );
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const addTransactionLog = useSimulatorStore((state) => state.addTransactionLog);
  const setActiveTransaction = useSimulatorStore(
    (state) => state.setActiveTransaction
  );
  const activeTransaction = useSimulatorStore((state) => state.activeTransaction);

  const handleTransactionRequest = (securityLevel: SecurityLevel) => {
    setSelectedSecurity(securityLevel);
    setShowTransactionModal(true);
  };

  const sendTransaction = (
    operation: OperationType,
    register: string = 'CONFIG_REG_0'
  ) => {
    const transactionId = `txn-${Date.now()}`;
    const transaction = {
      type: 'transaction' as const,
      id: transactionId,
      source: ComponentType.ARM_CPU,
      destination: ComponentType.CRYPTO,
      securityLevel: selectedSecurity,
      operation,
      register,
      value: operation === OperationType.WRITE ? '0xDEADBEEF' : undefined,
      timestamp: new Date().toISOString(),
    };

    // Add to log immediately
    addTransactionLog({
      id: transactionId,
      source: transaction.source,
      destination: transaction.destination,
      securityLevel: transaction.securityLevel,
      operation: transaction.operation,
      status: 'PENDING',
      timestamp: transaction.timestamp,
    });

    setActiveTransaction(transactionId);
    wsService.sendTransaction(transaction);
    setShowTransactionModal(false);
  };

  return (
    <div className="relative w-full h-full p-8">
      {/* Block Diagram Layout */}
      <div className="flex items-center justify-around h-full">
        {/* ARM CPU */}
        <div className="flex flex-col items-center">
          <ARMCPUBlock onTransactionRequest={handleTransactionRequest} />
        </div>

        {/* Connection Arrow */}
        <div className="flex flex-col items-center">
          <ArrowRight
            className={clsx(
              'w-12 h-12 transition-all duration-300',
              activeTransaction ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            )}
          />
        </div>

        {/* NOC */}
        <div className="flex flex-col items-center">
          <NOCBlock />
        </div>

        {/* Connection Arrow */}
        <div className="flex flex-col items-center">
          <ArrowRight
            className={clsx(
              'w-12 h-12 transition-all duration-300',
              activeTransaction ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            )}
          />
        </div>

        {/* Crypto Block */}
        <div className="flex flex-col items-center">
          <CryptoBlock />
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              Send Transaction (
              <span
                className={clsx(
                  selectedSecurity === SecurityLevel.SECURE
                    ? 'text-green-600'
                    : 'text-yellow-600'
                )}
              >
                {selectedSecurity}
              </span>
              )
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Select the operation to perform on the Crypto Block:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => sendTransaction(OperationType.READ, 'CONFIG_REG_0')}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-left"
              >
                <div className="font-bold">Read Config Register</div>
                <div className="text-xs opacity-90">
                  Read CONFIG_REG_0 from Crypto Block
                </div>
              </button>

              <button
                onClick={() => sendTransaction(OperationType.WRITE, 'CONFIG_REG_0')}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium text-left"
              >
                <div className="font-bold">Write Config Register</div>
                <div className="text-xs opacity-90">
                  Write 0xDEADBEEF to CONFIG_REG_0 (requires secure mode)
                </div>
              </button>

              <button
                onClick={() => sendTransaction(OperationType.WRITE, 'DATA_REG_0')}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-left"
              >
                <div className="font-bold">Write Data Register</div>
                <div className="text-xs opacity-90">
                  Write 0xDEADBEEF to DATA_REG_0 (allowed in non-secure)
                </div>
              </button>

              <button
                onClick={() => setShowTransactionModal(false)}
                className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
