import React from 'react';
import { Terminal, Sparkles, Zap, Github } from 'lucide-react';
import { PRESETS } from '../presets/samples';

interface TopNavProps {
  activePresetId: string;
  onSelectPreset: (id: string, data: string) => void;
  onRunChaos: () => void;
  isChaosRunning: boolean;
  canRunChaos: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activePresetId,
  onSelectPreset,
  onRunChaos,
  isChaosRunning,
  canRunChaos
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-obsidian-900 border-b border-obsidian-700 shrink-0">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white">ContractForge</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Devpost PoC
            </span>
          </div>
          <p className="text-[11px] text-slate-400">The Universal API & Agent Schema Studio</p>
        </div>
      </div>

      {/* Preset Pills (Zero-Typing Evaluation for Judges) */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-xs text-slate-400 hidden lg:inline mr-1">Presets:</span>
        {PRESETS.map(preset => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id, preset.data)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                isActive
                  ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50 shadow-sm'
                  : 'bg-obsidian-800 text-slate-300 border-obsidian-700 hover:bg-obsidian-700 hover:text-white'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Run Chaos Mock CTA & Repo Link */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunChaos}
          disabled={!canRunChaos || isChaosRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-40"
        >
          <Zap className={`w-3.5 h-3.5 text-emerald-200 ${isChaosRunning ? 'animate-spin' : ''}`} />
          <span>{isChaosRunning ? 'Running Chaos...' : 'Run Chaos Mock'}</span>
        </button>

        <a
          href="https://github.com/challengepost/learn-ai-basics"
          target="_blank"
          rel="noreferrer"
          title="Devpost Hackathon Skill Pack"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-obsidian-800 transition"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
