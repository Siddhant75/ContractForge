import React, { useState } from 'react';
import {
  Play,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X
} from 'lucide-react';
import { FuzzTestCase } from '../types/ast';

interface ChaosRunnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: FuzzTestCase[];
  onRunFuzz: () => void;
  isRunning: boolean;
}

export const ChaosRunnerDrawer: React.FC<ChaosRunnerDrawerProps> = ({
  isOpen,
  onClose,
  testCases,
  onRunFuzz,
  isRunning
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const passedCount = testCases.filter(t => t.passed).length;
  const interceptedCount = testCases.filter(t => !t.passed).length;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-obsidian-900 border-t border-obsidian-700 shadow-2xl transition-all duration-300 max-h-[75vh] flex flex-col">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-obsidian-950/90 border-b border-obsidian-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Interactive Chaos & Mock Runner
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
                POST /api/v1/mock-test
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live in-memory schema fuzzing & edge-case contract validation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {testCases.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono mr-2">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {passedCount} Valid
              </span>
              <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                {interceptedCount} Intercepted
              </span>
            </div>
          )}

          <button
            onClick={onRunFuzz}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Chaos Suite...' : 'Run Chaos Mock'}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-obsidian-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Results Table / Cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 font-sans">
        {testCases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Click <strong className="text-emerald-400">"Run Chaos Mock"</strong> above to generate synthetic payloads and test edge-case mutations against the compiled contract.
          </div>
        ) : (
          testCases.map(tc => {
            const isExpanded = expandedId === tc.id;
            return (
              <div
                key={tc.id}
                className="bg-obsidian-950/70 border border-obsidian-800 rounded-xl overflow-hidden hover:border-obsidian-700 transition"
              >
                <div
                  onClick={() => toggleExpand(tc.id)}
                  className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {tc.passed ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        200 OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
                        <XCircle className="w-3.5 h-3.5" />
                        422 REJECTED
                      </span>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">
                        {tc.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tc.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px] bg-obsidian-900 px-2 py-0.5 rounded border border-obsidian-800">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {tc.simulatedLatencyMs}ms
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Payload & Diagnostics */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-obsidian-800/80 bg-obsidian-900/40 text-xs">
                    {/* Error Diagnostics */}
                    {tc.errors && tc.errors.length > 0 && (
                      <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        <span className="font-semibold block mb-1">Contract Validation Issues:</span>
                        <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                          {tc.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Payload JSON */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Simulated Payload:
                      </span>
                      <pre className="p-3 rounded-lg bg-obsidian-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-obsidian-800">
                        <code>{JSON.stringify(tc.payload, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
