import { useState, useMemo } from 'react';
import { STRIPE_PAYMENT_SAMPLE } from './presets/samples';
import { inferSchema } from './engine/schemaInferrer';
import { generateTypeScript } from './engine/generators/typescript';
import { generateZod } from './engine/generators/zod';
import { generateOpenAiStrict } from './engine/generators/openAiStrict';
import { generateAnthropic } from './engine/generators/anthropic';
import { compileZodSchema, generateFuzzTestCases, executeFuzzSuite } from './engine/chaosFuzzer';
import { isCurlCommand, parseCurl } from './engine/curlLexer';
import { parseJsonResilient } from './engine/jsonParser';
import { TopNav } from './components/TopNav';
import { InputStudio, CurlMeta } from './components/InputStudio';
import { ContractStudio } from './components/ContractStudio';
import { ChaosRunnerDrawer } from './components/ChaosRunnerDrawer';
import { FuzzTestCase } from './types/ast';

export function App() {
  const [rawInput, setRawInput] = useState<string>(STRIPE_PAYMENT_SAMPLE);
  const [activePresetId, setActivePresetId] = useState<string>('stripe');
  const [isRunnerOpen, setIsRunnerOpen] = useState<boolean>(false);
  const [fuzzTestCases, setFuzzTestCases] = useState<FuzzTestCase[]>([]);
  const [isFuzzRunning, setIsFuzzRunning] = useState<boolean>(false);

  // Ingest, auto-detect (cURL vs JSON), recover and infer 4 target contracts reactively
  const {
    typescriptCode,
    zodCode,
    openAiCode,
    anthropicCode,
    parseError,
    currentAst,
    inputMode,
    isAutoSanitized,
    sanitizedJson,
    curlMeta
  } = useMemo(() => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        typescriptCode: '',
        zodCode: '',
        openAiCode: '',
        anthropicCode: '',
        parseError: null,
        currentAst: null,
        inputMode: 'json' as const,
        isAutoSanitized: false,
        sanitizedJson: '',
        curlMeta: null
      };
    }

    const isCurl = isCurlCommand(trimmed);

    if (isCurl) {
      const curlRes = parseCurl(trimmed);
      const meta: CurlMeta = {
        method: curlRes.method,
        url: curlRes.url,
        hasBody: curlRes.rawBody !== undefined,
        queryParamCount: Object.keys(curlRes.queryParams).length
      };

      if (!curlRes.effectivePayload || (typeof curlRes.effectivePayload === 'object' && Object.keys(curlRes.effectivePayload).length === 0 && !curlRes.url)) {
        return {
          typescriptCode: '// Provide valid cURL command with query params or -d JSON body...',
          zodCode: '// Provide valid cURL command with query params or -d JSON body...',
          openAiCode: '// Provide valid cURL command with query params or -d JSON body...',
          anthropicCode: '// Provide valid cURL command with query params or -d JSON body...',
          parseError: curlRes.error || 'Empty or invalid cURL command',
          currentAst: null,
          inputMode: 'curl' as const,
          isAutoSanitized: false,
          sanitizedJson: '',
          curlMeta: meta
        };
      }

      try {
        const rootName = curlRes.method.toLowerCase() + '_contract';
        const ast = inferSchema(curlRes.effectivePayload, 'Root');
        const ts = generateTypeScript(ast, 'Root');
        const zod = generateZod(ast, 'Root');
        const openAi = generateOpenAiStrict(ast, rootName);
        const claude = generateAnthropic(ast, rootName);

        return {
          typescriptCode: ts,
          zodCode: zod,
          openAiCode: openAi,
          anthropicCode: claude,
          parseError: null,
          currentAst: ast,
          inputMode: 'curl' as const,
          isAutoSanitized: false,
          sanitizedJson: '',
          curlMeta: meta
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error inferring schema from cURL';
        return {
          typescriptCode: '// Error analyzing cURL payload...',
          zodCode: '// Error analyzing cURL payload...',
          openAiCode: '// Error analyzing cURL payload...',
          anthropicCode: '// Error analyzing cURL payload...',
          parseError: msg,
          currentAst: null,
          inputMode: 'curl' as const,
          isAutoSanitized: false,
          sanitizedJson: '',
          curlMeta: meta
        };
      }
    }

    // Otherwise JSON mode with resilient fallback
    const jsonRes = parseJsonResilient(trimmed);

    if (!jsonRes.success) {
      return {
        typescriptCode: '// Fix JSON syntax error in editor...',
        zodCode: '// Fix JSON syntax error in editor...',
        openAiCode: '// Fix JSON syntax error in editor...',
        anthropicCode: '// Fix JSON syntax error in editor...',
        parseError: jsonRes.error || 'Invalid JSON syntax',
        currentAst: null,
        inputMode: 'json' as const,
        isAutoSanitized: false,
        sanitizedJson: '',
        curlMeta: null
      };
    }

    try {
      const ast = inferSchema(jsonRes.data, 'Root');
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
        currentAst: ast,
        inputMode: 'json' as const,
        isAutoSanitized: jsonRes.isSanitized,
        sanitizedJson: jsonRes.sanitizedJson || '',
        curlMeta: null
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating contracts from AST';
      return {
        typescriptCode: '// Error analyzing AST structure...',
        zodCode: '// Error analyzing AST structure...',
        openAiCode: '// Error analyzing AST structure...',
        anthropicCode: '// Error analyzing AST structure...',
        parseError: msg,
        currentAst: null,
        inputMode: 'json' as const,
        isAutoSanitized: jsonRes.isSanitized,
        sanitizedJson: jsonRes.sanitizedJson || '',
        curlMeta: null
      };
    }
  }, [rawInput]);

  const handleFormat = () => {
    if (inputMode === 'json') {
      const res = parseJsonResilient(rawInput);
      if (res.success) {
        setRawInput(JSON.stringify(res.data, null, 2));
      }
    } else {
      // For cURL, parse and if body has JSON, format the body
      const curlRes = parseCurl(rawInput);
      if (curlRes.isCurl && curlRes.rawBody) {
        const bodyRes = parseJsonResilient(curlRes.rawBody);
        if (bodyRes.success) {
          const prettyBody = JSON.stringify(bodyRes.data, null, 2);
          // Replace rawBody in cURL string
          const formatted = rawInput.replace(curlRes.rawBody, prettyBody);
          setRawInput(formatted);
        }
      }
    }
  };

  const handleApplySanitized = () => {
    if (sanitizedJson) {
      setRawInput(sanitizedJson);
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
          inputMode={inputMode}
          isAutoSanitized={isAutoSanitized}
          onApplySanitized={handleApplySanitized}
          curlMeta={curlMeta}
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
          <span>
            {inputMode === 'curl'
              ? `Ingestion Active — cURL Lexer Tokenized [${curlMeta?.method || 'GET'}]`
              : 'Ingestion Active — Resilient JSON Ingest & Auto-Sanitizer Active'}
          </span>
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
