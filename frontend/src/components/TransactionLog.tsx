import React from 'react';
import { ScrollText, Download, Trash2 } from 'lucide-react';
import { useSimulatorStore } from '../store/simulatorStore';
import { TransactionStatus } from '../types';
import clsx from 'clsx';

const statusColors = {
  [TransactionStatus.PENDING]: 'text-yellow-600 bg-yellow-50',
  [TransactionStatus.ROUTING]: 'text-blue-600 bg-blue-50',
  [TransactionStatus.CHECKING]: 'text-purple-600 bg-purple-50',
  [TransactionStatus.SUCCESS]: 'text-green-600 bg-green-50',
  [TransactionStatus.DENIED]: 'text-red-600 bg-red-50',
  [TransactionStatus.ERROR]: 'text-red-800 bg-red-100',
};

export const TransactionLog: React.FC = () => {
  const transactionLog = useSimulatorStore((state) => state.transactionLog);
  const clearLogs = useSimulatorStore((state) => state.clearLogs);

  const handleExport = () => {
    const data = JSON.stringify(transactionLog, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">Transaction Log</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={transactionLog.length === 0}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            disabled={transactionLog.length === 0}
            className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {transactionLog.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          transactionLog.map((entry) => (
            <div
              key={entry.id}
              className="border rounded-lg p-3 text-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-bold',
                    statusColors[entry.status]
                  )}
                >
                  {entry.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-600">From:</span>{' '}
                  {entry.source}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">To:</span>{' '}
                  {entry.destination}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Security:</span>{' '}
                  <span
                    className={clsx(
                      entry.securityLevel === 'secure'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    )}
                  >
                    {entry.securityLevel}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Operation:</span>{' '}
                  {entry.operation}
                </div>
              </div>

              {entry.reason && (
                <p className="mt-2 text-xs text-gray-600 italic">{entry.reason}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
