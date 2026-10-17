import { useState, useMemo } from 'react';
import { Sparkles, Terminal, Zap } from 'lucide-react';
import { STRIPE_PAYMENT_SAMPLE } from './presets/samples';
import { inferSchema } from './engine/schemaInferrer';
import { generateTypeScript } from './engine/generators/typescript';
import { generateZod } from './engine/generators/zod';
import { compileZodSchema, generateFuzzTestCases, executeFuzzSuite } from './engine/chaosFuzzer';
import { InputStudio } from './components/InputStudio';
import { ContractStudio } from './components/ContractStudio';
import { ChaosRunnerDrawer } from './components/ChaosRunnerDrawer';
import { FuzzTestCase } from './types/ast';

export function App() {
  const [rawInput, setRawInput] = useState<string>(STRIPE_PAYMENT_SAMPLE);
  const [isRunnerOpen, setIsRunnerOpen] = useState<boolean>(false);
  const [fuzzTestCases, setFuzzTestCases] = useState<FuzzTestCase[]>([]);
  const [isFuzzRunning, setIsFuzzRunning] = useState<boolean>(false);

  // Ingest and infer contracts reactively
  const { typescriptCode, zodCode, parseError, currentAst } = useMemo(() => {
    if (!rawInput.trim()) {
      return { typescriptCode: '', zodCode: '', parseError: null, currentAst: null };
    }

    try {
      const parsed = JSON.parse(rawInput);
      const ast = inferSchema(parsed, 'Root');
      const ts = generateTypeScript(ast, 'Root');
      const zod = generateZod(ast, 'Root');
      return { typescriptCode: ts, zodCode: zod, parseError: null, currentAst: ast };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      return {
        typescriptCode: '// Fix JSON syntax error in editor...',
        zodCode: '// Fix JSON syntax error in editor...',
        parseError: msg,
        currentAst: null
      };
    }
  }, [rawInput]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(rawInput);
      setRawInput(JSON.stringify(parsed, null, 2));
    } catch {
      // Retain current input if malformed
    }
  };

  const handleClear = () => {
    setRawInput('');
    setFuzzTestCases([]);
  };

  const handleLoadStripe = () => {
    setRawInput(STRIPE_PAYMENT_SAMPLE);
  };

  const handleRunChaosSuite = async () => {
    if (!currentAst) return;

    setIsRunnerOpen(true);
    setIsFuzzRunning(true);

    try {
      // Compile real in-memory schema directly from AST
      const schema = compileZodSchema(currentAst);
      const initialCases = generateFuzzTestCases(currentAst);

      // Simulate network / worker execution latency
      await new Promise(resolve => setTimeout(resolve, 250));

      const validatedCases = executeFuzzSuite(initialCases, schema);
      setFuzzTestCases(validatedCases);
    } catch (err) {
      console.error('Chaos suite error:', err);
    } finally {
      setIsFuzzRunning(false);
    }
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

        {/* Presets & Chaos Launch CTA */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">Presets:</span>
          <button
            onClick={handleLoadStripe}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Stripe Payment Intent
          </button>

          <button
            onClick={handleRunChaosSuite}
            disabled={!currentAst}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-200" />
            Run Chaos Mock
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

      {/* Bottom Status & Chaos Runner Drawer Bar */}
      <footer className="flex items-center justify-between px-6 py-2 bg-obsidian-900 border-t border-obsidian-800 shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Active — Zero-Backend Reactive Mode</span>
        </div>

        <button
          onClick={() => setIsRunnerOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isRunnerOpen ? 'Hide Chaos Runner' : 'Show Chaos Runner'}</span>
          {fuzzTestCases.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-obsidian-950 text-emerald-400">
              {fuzzTestCases.filter(t => t.passed).length}/{fuzzTestCases.length} Passed
            </span>
          )}
        </button>
      </footer>

      {/* Interactive Chaos Runner Drawer */}
      <ChaosRunnerDrawer
        isOpen={isRunnerOpen}
        onClose={() => setIsRunnerOpen(false)}
        testCases={fuzzTestCases}
        onRunFuzz={handleRunChaosSuite}
        isRunning={isFuzzRunning}
      />
    </div>
  );
}

export default App;
