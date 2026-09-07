import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Code2, 
  FileCode, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { CodeAuditResult, AIModelId } from '../types';
import { playTerminalKeySound, playSuccessSound, playAlertSound, playBeep } from '../utils/audio';

const SAMPLE_CODES: Record<string, { label: string; lang: string; code: string; context: string }> = {
  tauri_rust: {
    label: 'Tauri Rust IPC Path Traversal (Podatny)',
    lang: 'rust',
    context: 'Obsługa odczytu plików w poleceniu IPC Tauri v2',
    code: `// Podatne polecenie Tauri: Path Traversal i brak walidacji wejścia
#[tauri::command]
pub fn read_user_config(filename: String) -> Result<String, String> {
    // KRYTYCZNA LUKA: Bezpośrednia konkatenacja ścieżki bez kanonizacji
    // Atakujący może przekazać "../../etc/passwd" lub ścieżkę SAM w Windows
    let base_path = "/var/app/data/";
    let full_path = format!("{}{}", base_path, filename);
    
    std::fs::read_to_string(&full_path)
        .map_err(|e| e.to_string())
}`,
  },
  c_buffer: {
    label: 'Przepełnienie bufora na stosie w C',
    lang: 'c',
    context: 'Parser pakietów demona sieciowego w C',
    code: `#include <stdio.h>
#include <string.h>

void parse_packet(const char *user_input) {
    char local_buffer[64];
    // KRYTYCZNA LUKA: Funkcja strcpy nie sprawdza granic bufora!
    // Przekroczenie 64 bajtów nadpisuje wskaźnik ramki i adres powrotu na stosie
    strcpy(local_buffer, user_input);
    printf("Otrzymano: %s\\n", local_buffer);
}

int main(int argc, char **argv) {
    if (argc > 1) parse_packet(argv[1]);
    return 0;
}`,
  },
  python_sqli: {
    label: 'Wstrzyknięcie SQL w Pythonie (SQLi)',
    lang: 'python',
    context: 'Punkt końcowy uwierzytelniania w FastAPI / Flask',
    code: `import sqlite3

def authenticate_operator(username, password_hash):
    conn = sqlite3.connect("cybersec.db")
    cursor = conn.cursor()
    
    # KRYTYCZNA LUKA: Bezpośrednia interpolacja stringa umożliwia SQL Injection
    # Przykładowy ładunek: ' OR '1'='1' --
    query = f"SELECT * FROM operators WHERE user = '{username}' AND pass = '{password_hash}'"
    cursor.execute(query)
    return cursor.fetchone()`,
  },
  node_rce: {
    label: 'Wstrzyknięcie poleceń w Node.js (RCE)',
    lang: 'javascript',
    context: 'Diagnostyka sieciowa ping w trasie Express',
    code: `const { exec } = require('child_process');

app.post('/api/diagnostics/ping', (req, res) => {
    const targetHost = req.body.host;
    // KRYTYCZNA LUKA: Przekazanie nieoczyszczonego wejścia do powłoki systemowej
    // Ładunek: 127.0.0.1; cat /etc/passwd
    exec(\`ping -c 3 \${targetHost}\`, (error, stdout) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ output: stdout });
    });
});`,
  },
};

interface CodeAuditorProps {
  selectedModel?: AIModelId;
}

export const CodeAuditor: React.FC<CodeAuditorProps> = ({ selectedModel }) => {
  const [language, setLanguage] = useState('rust');
  const [sourceCode, setSourceCode] = useState(SAMPLE_CODES.tauri_rust.code);
  const [context, setContext] = useState(SAMPLE_CODES.tauri_rust.context);
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<CodeAuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRemediation, setCopiedRemediation] = useState(false);
  const [activeView, setActiveView] = useState<'findings' | 'securedCode'>('findings');

  const runAudit = async () => {
    if (!sourceCode.trim() || loading) return;
    playTerminalKeySound();
    setLoading(true);
    setErrorMessage(null);
    setAuditResult(null);

    try {
      const res = await fetch('/api/audit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sourceCode,
          language,
          context,
          model: selectedModel || 'gemini-3.8-flash',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      playSuccessSound();
      setAuditResult(data);
      setActiveView('findings');
    } catch (err: any) {
      playAlertSound();
      setErrorMessage(err.message || 'Audit execution interrupted');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (key: string) => {
    const sample = SAMPLE_CODES[key];
    if (!sample) return;
    playBeep(1000, 0.05);
    setLanguage(sample.lang);
    setSourceCode(sample.code);
    setContext(sample.context);
    setAuditResult(null);
  };

  const copySecured = () => {
    if (!auditResult?.secureVersion) return;
    navigator.clipboard.writeText(auditResult.secureVersion);
    setCopiedRemediation(true);
    playBeep(900, 0.05);
    setTimeout(() => setCopiedRemediation(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#0b0f19] font-sans text-xs overflow-y-auto">
      {/* Top action bar */}
      <div className="px-5 py-3 bg-[#0f1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm">Statyczny Audytor Bezpieczeństwa i Podatności (SAST)</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">Analiza AST</span>
            </div>
            <p className="text-slate-400 text-[11px]">Audyt kodu źródłowego pod kątem bezpieczeństwa pamięci, luk na granicy IPC w Tauri oraz wektorów wstrzykiwań</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-medium">Szablony:</span>
          <div className="inline-flex rounded-lg border border-slate-700/80 bg-slate-900 p-0.5">
            <button
              onClick={() => loadSample('tauri_rust')}
              className="px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
            >
              Tauri Rust IPC
            </button>
            <button
              onClick={() => loadSample('c_buffer')}
              className="px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
            >
              Przepełnienie bufora C
            </button>
            <button
              onClick={() => loadSample('python_sqli')}
              className="px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
            >
              Python SQLi
            </button>
            <button
              onClick={() => loadSample('node_rce')}
              className="px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium cursor-pointer"
            >
              Node.js RCE
            </button>
          </div>
        </div>
      </div>

      {/* Main split workbench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-5 overflow-hidden">
        {/* Left: Input Code Editor */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200 font-semibold text-xs">Bufor Kodu Źródłowego</span>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="rust">Rust (Backend Tauri)</option>
                <option value="c">C / C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript / Node.js</option>
                <option value="typescript">TypeScript (React/Vite)</option>
                <option value="go">Golang</option>
                <option value="solidity">Solidity</option>
                <option value="bash">Bash / Shell</option>
              </select>

              <button
                onClick={runAudit}
                disabled={loading || !sourceCode.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>{loading ? 'Analizowanie...' : 'Uruchom audyt'}</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 border-b border-slate-800/80 bg-[#0d1424]">
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Kontekst wykonania (np. moduł obsługi IPC w Tauri v2, uprzywilejowany demon Linux)..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <textarea
            id="code-auditor-textarea"
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Wklej fragment kodu do audytu pod kątem bezpieczeństwa pamięci, wstrzykiwań IPC, współbieżności lub luk logicznych..."
            className="flex-1 p-4 bg-[#090d16] text-slate-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-900/60"
            spellCheck={false}
          />
        </div>

        {/* Right: Security Assessment Findings */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-slate-200 font-semibold text-xs">Ocena Bezpieczeństwa</span>
            </div>

            {auditResult && (
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setActiveView('findings')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeView === 'findings'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Podatności ({auditResult.findings?.length || 0})
                </button>
                <button
                  onClick={() => setActiveView('securedCode')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeView === 'securedCode'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kod Naprawiony
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-center p-8">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-200 font-medium text-sm">
                  Dekompozycja drzewa składniowego (AST) i przepływu danych...
                </p>
                <p className="text-slate-400 text-xs max-w-sm">
                  Weryfikacja granic pamięci, niesprawdzona deserializacja w IPC oraz wektory eskalacji uprawnień.
                </p>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Komunikat Silnika Audytu</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {errorMessage}
                </p>
                <button
                  onClick={runAudit}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-md border border-rose-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Ponów audyt
                </button>
              </div>
            )}

            {!loading && !errorMessage && !auditResult && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <Code2 className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-semibold text-sm">Oczekiwanie na kod źródłowy</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Wybierz szablon powyżej lub wklej swój kod źródłowy po lewej stronie, a następnie kliknij <strong>Uruchom audyt</strong>.
                  </p>
                </div>
              </div>
            )}

            {!loading && auditResult && activeView === 'findings' && (
              <div className="space-y-4">
                {/* Risk Score Card */}
                <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Wskaźnik Ryzyka Bezpieczeństwa</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-bold text-white font-mono">
                        {auditResult.riskScore}
                        <span className="text-slate-500 text-base font-normal">/100</span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          auditResult.riskLevel === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : auditResult.riskLevel === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : auditResult.riskLevel === 'MEDIUM'
                            ? 'bg-yellow-950 text-yellow-300 border-yellow-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        POZIOM: {auditResult.riskLevel === 'CRITICAL' ? 'KRYTYCZNY' : auditResult.riskLevel === 'HIGH' ? 'WYSOKI' : auditResult.riskLevel === 'MEDIUM' ? 'ŚREDNI' : 'NISKI'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveView('securedCode')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Zobacz załatany kod</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed text-xs">
                  <span className="text-slate-400 font-semibold text-xs block mb-1">Podsumowanie Audytu</span>
                  {auditResult.summary}
                </div>

                {/* Findings List */}
                <div className="space-y-3">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">
                    Wykryte Zagrożenia ({auditResult.findings?.length || 0})
                  </span>

                  {auditResult.findings?.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-800 bg-[#111927] space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="font-semibold text-slate-100 text-xs">{finding.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            {finding.severity}
                          </span>
                          {finding.cwe && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              {finding.cwe}
                            </span>
                          )}
                        </div>
                      </div>

                      {finding.line && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          <span className="text-cyan-400 font-semibold">Lokalizacja / Wzorzec:</span> {finding.line}
                        </p>
                      )}

                      <p className="text-slate-300 text-xs leading-relaxed">{finding.description}</p>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        <span className="text-cyan-400 font-semibold">Mitygacja i Naprawa: </span>
                        {finding.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && auditResult && activeView === 'securedCode' && (
              <div className="space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Zabezpieczona i Załatana Implementacja
                  </span>

                  <button
                    onClick={copySecured}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedRemediation ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Skopiowano!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiuj załatany kod</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="flex-1 p-4 rounded-xl bg-[#090d16] border border-slate-800 overflow-auto text-slate-200 font-mono text-xs leading-relaxed">
                  <code>{auditResult.secureVersion}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
