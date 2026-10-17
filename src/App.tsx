import { useState, useMemo } from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import { STRIPE_PAYMENT_SAMPLE } from './presets/samples';
import { inferSchema } from './engine/schemaInferrer';
import { generateTypeScript } from './engine/generators/typescript';
import { generateZod } from './engine/generators/zod';
import { InputStudio } from './components/InputStudio';
import { ContractStudio } from './components/ContractStudio';

export function App() {
  const [rawInput, setRawInput] = useState<string>(STRIPE_PAYMENT_SAMPLE);
  const [parseError, setParseError] = useState<string | null>(null);

  // Ingest and infer contracts reactively
  const { typescriptCode, zodCode } = useMemo(() => {
    if (!rawInput.trim()) {
      setParseError(null);
      return { typescriptCode: '', zodCode: '' };
    }

    try {
      const parsed = JSON.parse(rawInput);
      setParseError(null);
      const ast = inferSchema(parsed, 'Root');
      const ts = generateTypeScript(ast, 'Root');
      const zod = generateZod(ast, 'Root');
      return { typescriptCode: ts, zodCode: zod };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      setParseError(msg);
      // Retain existing contracts or return empty
      return { typescriptCode: '// Fix JSON syntax error in editor...', zodCode: '// Fix JSON syntax error in editor...' };
    }
  }, [rawInput]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(rawInput);
      setRawInput(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot format invalid JSON';
      setParseError(msg);
    }
  };

  const handleClear = () => {
    setRawInput('');
    setParseError(null);
  };

  const handleLoadStripe = () => {
    setRawInput(STRIPE_PAYMENT_SAMPLE);
    setParseError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-obsidian-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-3 bg-obsidian-900 border-b border-obsidian-700 shrink-0">
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

        {/* Preset Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Presets:</span>
          <button
            onClick={handleLoadStripe}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Stripe Payment Intent
          </button>
        </div>
      </header>

      {/* Main Studio Split-Pane */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <InputStudio
          value={rawInput}
          onChange={setRawInput}
          error={parseError}
          onFormat={handleFormat}
          onClear={handleClear}
        />
        <ContractStudio
          typescriptCode={typescriptCode}
          zodCode={zodCode}
        />
      </main>
    </div>
  );
}

export default App;
