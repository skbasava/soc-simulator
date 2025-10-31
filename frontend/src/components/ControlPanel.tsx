import React, { useState } from 'react';
import { Play, Square, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { useSimulatorStore } from '../store/simulatorStore';
import { wsService } from '../services/websocket';
import clsx from 'clsx';

export const ControlPanel: React.FC = () => {
  const isConnected = useSimulatorStore((state) => state.isConnected);
  const isRunning = useSimulatorStore((state) => state.isRunning);
  const setConnected = useSimulatorStore((state) => state.setConnected);
  const setRunning = useSimulatorStore((state) => state.setRunning);
  const reset = useSimulatorStore((state) => state.reset);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await wsService.connect();
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to backend. Make sure the server is running.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    wsService.disconnect();
    setConnected(false);
    setRunning(false);
  };

  const handleStart = () => {
    wsService.sendControl('start');
    setRunning(true);
  };

  const handleStop = () => {
    wsService.sendControl('stop');
    setRunning(false);
  };

  const handleReset = () => {
    wsService.sendControl('reset');
    reset();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Simulation Control</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )}
          />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wifi className="w-4 h-4" />
            {connecting ? 'Connecting...' : 'Connect to Backend'}
          </button>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
            >
              <WifiOff className="w-4 h-4" />
              Disconnect
            </button>

            <div className="border-t pt-3 space-y-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Simulation
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Simulation
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
