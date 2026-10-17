import React, { useState, useRef } from 'react';
import { Copy, Check, Download, Layers } from 'lucide-react';

export type OutputTab = 'typescript' | 'zod';

interface ContractStudioProps {
  typescriptCode: string;
  zodCode: string;
}

export const ContractStudio: React.FC<ContractStudioProps> = ({
  typescriptCode,
  zodCode
}) => {
  const [activeTab, setActiveTab] = useState<OutputTab>('typescript');
  const [copied, setCopied] = useState(false);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const currentCode = activeTab === 'typescript' ? typescriptCode : zodCode;
  const fileName = activeTab === 'typescript' ? 'contracts.ts' : 'schema.zod.ts';
  const lineCount = Math.max(currentCode.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border border-obsidian-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-obsidian-950/60 border-b border-obsidian-700">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('typescript')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'typescript'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            TypeScript
          </button>
          <button
            onClick={() => setActiveTab('zod')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'zod'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Zod Schema
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            title="Download file"
            className="p-1 text-slate-400 hover:text-white bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px]">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-4 bg-obsidian-950/40 text-slate-600 text-right pr-3 select-none border-r border-obsidian-800/80 overflow-hidden shrink-0"
        >
          {lineNumbers.map(n => (
            <div key={n} className="leading-6 text-[12px]">{n}</div>
          ))}
        </div>

        {/* Code Content */}
        <div
          onScroll={(e) => {
            if (lineNumbersRef.current) {
              lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          className="flex-1 p-4 leading-6 overflow-auto text-slate-200 bg-obsidian-950/30 selection:bg-indigo-500/30"
        >
          <pre className="whitespace-pre">
            <code>{currentCode || '// Valid code will generate here automatically...'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
