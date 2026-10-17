import React, { useState, useRef } from 'react';
import { Copy, Check, Download, Layers, ShieldCheck, Bot, Sparkles } from 'lucide-react';

export type OutputTab = 'typescript' | 'zod' | 'openai' | 'anthropic';

interface ContractStudioProps {
  typescriptCode: string;
  zodCode: string;
  openAiCode: string;
  anthropicCode: string;
}

export const ContractStudio: React.FC<ContractStudioProps> = ({
  typescriptCode,
  zodCode,
  openAiCode,
  anthropicCode
}) => {
  const [activeTab, setActiveTab] = useState<OutputTab>('typescript');
  const [copied, setCopied] = useState(false);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const getActiveData = () => {
    switch (activeTab) {
      case 'typescript':
        return { code: typescriptCode, ext: 'ts', label: 'TypeScript Interface' };
      case 'zod':
        return { code: zodCode, ext: 'zod.ts', label: 'Zod Validator Schema' };
      case 'openai':
        return { code: openAiCode, ext: 'openai.json', label: 'OpenAI Strict Tool Spec' };
      case 'anthropic':
        return { code: anthropicCode, ext: 'claude.json', label: 'Anthropic Claude Tool Spec' };
    }
  };

  const { code: currentCode, ext: fileExt, label: tabLabel } = getActiveData();
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
    const isJson = fileExt.endsWith('.json');
    const mime = isJson ? 'application/json;charset=utf-8' : 'text/typescript;charset=utf-8';
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contract.${fileExt}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border border-obsidian-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-obsidian-950/60 border-b border-obsidian-700">
        {/* Tab Buttons (4 Multi-Target Outputs) */}
        <div className="flex items-center gap-1 overflow-x-auto">
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
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zod Schema
          </button>

          <button
            onClick={() => setActiveTab('openai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'openai'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            OpenAI (Strict)
          </button>

          <button
            onClick={() => setActiveTab('anthropic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'anthropic'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            Anthropic Tool
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-mono hidden md:inline mr-1">
            {tabLabel}
          </span>
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
            title={`Download contract.${fileExt}`}
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
