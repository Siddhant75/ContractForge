import { useState, useMemo } from 'react';
import { STRIPE_PAYMENT_SAMPLE } from './presets/samples';
import { inferSchema } from './engine/schemaInferrer';
import { generateTypeScript } from './engine/generators/typescript';
import { generateZod } from './engine/generators/zod';
import { generateOpenAiStrict } from './engine/generators/openAiStrict';
import { generateAnthropic } from './engine/generators/anthropic';
import { compileZodSchema, generateFuzzTestCases, executeFuzzSuite } from './engine/chaosFuzzer';
import { TopNav } from './components/TopNav';
import { InputStudio } from './components/InputStudio';
import { ContractStudio } from './components/ContractStudio';
import { ChaosRunnerDrawer } from './components/ChaosRunnerDrawer';
import { FuzzTestCase } from './types/ast';

export function App() {
  const [rawInput, setRawInput] = useState<string>(STRIPE_PAYMENT_SAMPLE);
  const [activePresetId, setActivePresetId] = useState<string>('stripe');
  const [isRunnerOpen, setIsRunnerOpen] = useState<boolean>(false);
  const [fuzzTestCases, setFuzzTestCases] = useState<FuzzTestCase[]>([]);
  const [isFuzzRunning, setIsFuzzRunning] = useState<boolean>(false);

  // Ingest and infer 4 target contracts reactively
  const { typescriptCode, zodCode, openAiCode, anthropicCode, parseError, currentAst } = useMemo(() => {
    if (!rawInput.trim()) {
      return {
        typescriptCode: '',
        zodCode: '',
        openAiCode: '',
        anthropicCode: '',
        parseError: null,
        currentAst: null
      };
    }

    try {
      const parsed = JSON.parse(rawInput);
      const ast = inferSchema(parsed, 'Root');
      const ts = generateTypeScript(ast, 'Root');
      const zod = generateZod(ast, 'Root');
      const openAi = generateOpenAiStrict(ast, 'execute_api_call');
      const claude = generateAnthropic(ast, 'execute_api_call');

      return {
        typescriptCode: ts,
        zodCode: zod,
        openAiCode: openAi,
        anthropicCode: claude,
        parseError: null,
        currentAst: ast
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      return {
        typescriptCode: '// Fix JSON syntax error in editor...',
        zodCode: '// Fix JSON syntax error in editor...',
        openAiCode: '// Fix JSON syntax error in editor...',
        anthropicCode: '// Fix JSON syntax error in editor...',
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
    setActivePresetId('');
    setFuzzTestCases([]);
  };

  const handleSelectPreset = (id: string, data: string) => {
    setActivePresetId(id);
    setRawInput(data);
    setFuzzTestCases([]);
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
      {/* Top Navigation Bar with Presets & CTAs */}
      <TopNav
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onRunChaos={handleRunChaosSuite}
        isChaosRunning={isFuzzRunning}
        canRunChaos={!!currentAst}
      />

      {/* Main Studio Split-Pane */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <InputStudio
          value={rawInput}
          onChange={(val) => {
            setRawInput(val);
            setActivePresetId('');
          }}
          error={parseError}
          onFormat={handleFormat}
          onClear={handleClear}
        />
        <ContractStudio
          typescriptCode={typescriptCode}
          zodCode={zodCode}
          openAiCode={openAiCode}
          anthropicCode={anthropicCode}
        />
      </main>

      {/* Bottom Status & Chaos Runner Drawer Bar */}
      <footer className="flex items-center justify-between px-6 py-2 bg-obsidian-900 border-t border-obsidian-800 shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Active — 4 Multi-Target Generators Live</span>
        </div>

        <button
          onClick={() => setIsRunnerOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 hover:bg-obsidian-700 rounded border border-obsidian-700 transition"
        >
          <span>{isRunnerOpen ? 'Hide Chaos Runner' : 'Show Chaos Runner'}</span>
          {fuzzTestCases.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-obsidian-950 text-emerald-400">
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
