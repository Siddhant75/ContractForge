import React from 'react';
import { Code, Trash2, Wand2, AlertCircle } from 'lucide-react';

interface InputStudioProps {
  value: string;
  onChange: (val: string) => void;
  error: string | null;
  onFormat: () => void;
  onClear: () => void;
}

export const InputStudio: React.FC<InputStudioProps> = ({
  value,
  onChange,
  error,
  onFormat,
  onClear
}) => {
  const lineCount = Math.max(value.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border border-obsidian-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-obsidian-950/60 border-b border-obsidian-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Input Payload (JSON)
          </span>
          <span className="text-[11px] text-slate-500 font-mono bg-obsidian-800 px-2 py-0.5 rounded">
            {value.length} bytes
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onFormat}
            title="Auto-format JSON"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            Format
          </button>
          <button
            onClick={onClear}
            title="Clear editor"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-400 bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-sm">
        {/* Line Numbers */}
        <div className="w-12 py-3 bg-obsidian-950/40 text-slate-600 text-right pr-3 select-none border-r border-obsidian-800/80 overflow-hidden">
          {lineNumbers.map(n => (
            <div key={n} className="leading-6 text-[12px]">{n}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="// Paste JSON payload or choose a preset above..."
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 placeholder-slate-600 resize-none outline-none leading-6 text-[13px] overflow-auto selection:bg-indigo-500/30 font-mono"
        />
      </div>
    </div>
  );
};
