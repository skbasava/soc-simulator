import React from 'react';
import { BlockDiagram } from './components/BlockDiagram';
import { ControlPanel } from './components/ControlPanel';
import { TransactionLog } from './components/TransactionLog';
import { useWebSocketEvents } from './hooks/useWebSocketEvents';
import { Chip } from 'lucide-react';

function App() {
  useWebSocketEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Chip className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">ARM SoC Simulator</h1>
            <p className="text-sm text-gray-400">
              Real-time hardware security simulation with TrustZone
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel />
          </div>

          {/* Center - Block Diagram */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-lg">
            <BlockDiagram />
          </div>

          {/* Right Sidebar - Transaction Log */}
          <div className="lg:col-span-1">
            <TransactionLog />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-6 py-2 text-center">
        <p className="text-xs text-gray-400">
          ARM SoC Simulator with P# State Machines | Built with React + TypeScript +
          Socket.io
        </p>
      </footer>
    </div>
  );
}

export default App;
