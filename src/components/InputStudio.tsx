import React, { useRef } from 'react';
import { Terminal, FileCode, Trash2, Wand2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export interface CurlMeta {
  method: string;
  url: string;
  hasBody: boolean;
  queryParamCount: number;
}

interface InputStudioProps {
  value: string;
  onChange: (val: string) => void;
  error: string | null;
  onFormat: () => void;
  onClear: () => void;
  inputMode: 'json' | 'curl';
  isAutoSanitized: boolean;
  onApplySanitized: () => void;
  curlMeta?: CurlMeta | null;
}

export const InputStudio: React.FC<InputStudioProps> = ({
  value,
  onChange,
  error,
  onFormat,
  onClear,
  inputMode,
  isAutoSanitized,
  onApplySanitized,
  curlMeta
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'PUT':
      case 'PATCH': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border border-obsidian-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-obsidian-950/60 border-b border-obsidian-700">
        <div className="flex items-center gap-2">
          {inputMode === 'curl' ? (
            <Terminal className="w-4 h-4 text-indigo-400" />
          ) : (
            <FileCode className="w-4 h-4 text-slate-400" />
          )}

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Input Studio
          </span>

          {/* Mode Pill */}
          {inputMode === 'curl' ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                cURL Command
              </span>
              {curlMeta && (
                <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded border ${getMethodBadgeColor(curlMeta.method)}`}>
                  {curlMeta.method}
                </span>
              )}
            </div>
          ) : (
            <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded border bg-slate-800 text-slate-300 border-slate-700">
              JSON Payload
            </span>
          )}

          <span className="text-[11px] text-slate-500 font-mono bg-obsidian-800 px-2 py-0.5 rounded">
            {value.length} bytes
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onFormat}
            title={inputMode === 'curl' ? 'Auto-format cURL / payload' : 'Auto-format JSON'}
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

      {/* cURL Metadata Banner */}
      {inputMode === 'curl' && curlMeta && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/20 border-b border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="text-slate-400 font-medium shrink-0">Target:</span>
            <span className="text-indigo-300 font-mono truncate">{curlMeta.url || '(none specified)'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
            {curlMeta.queryParamCount > 0 && (
              <span className="bg-obsidian-800 px-1.5 py-0.5 rounded text-sky-400">
                {curlMeta.queryParamCount} params
              </span>
            )}
            <span className="bg-obsidian-800 px-1.5 py-0.5 rounded text-slate-300">
              {curlMeta.hasBody ? 'Request Body' : 'Query Schema'}
            </span>
          </div>
        </div>
      )}

      {/* Auto-Sanitized Alert Banner */}
      {isAutoSanitized && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/20 text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Auto-sanitized syntax issues (trailing commas / comments recovered).</span>
          </div>
          <button
            onClick={onApplySanitized}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded transition"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Apply Clean JSON
          </button>
        </div>
      )}

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
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 bg-obsidian-950/40 text-slate-600 text-right pr-3 select-none border-r border-obsidian-800/80 overflow-hidden"
        >
          {lineNumbers.map(n => (
            <div key={n} className="leading-6 text-[12px]">{n}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="// Paste JSON payload or terminal cURL command (e.g. curl -X POST ...)"
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 placeholder-slate-600 resize-none outline-none leading-6 text-[13px] overflow-auto selection:bg-indigo-500/30 font-mono"
        />
      </div>
    </div>
  );
};
