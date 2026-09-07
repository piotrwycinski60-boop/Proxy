import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle,
  CheckCircle, 
  FileJson, 
  Terminal, 
  Layers,
  Lock,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { TauriAuditResult, AIModelId } from '../types';
import { playTerminalKeySound, playSuccessSound, playAlertSound, playBeep } from '../utils/audio';

const DEFAULT_TAURI_CONF = `{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../dist"
  },
  "package": {
    "productName": "cyber-tauri-app",
    "version": "0.1.0"
  },
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src ipc: http: https:;"
    },
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "scope": ["$APPDATA/*"]
      },
      "shell": {
        "all": false,
        "execute": false,
        "open": true
      }
    }
  }
}`;

const DEFAULT_RUST_IPC = `// src-tauri/src/main.rs lub lib.rs
use tauri::command;
use std::path::PathBuf;

#[command]
fn get_system_telemetry(probe_id: String) -> Result<String, String> {
    // Sprawdzenie poprawności i sanityzacja wejścia
    if probe_id.len() > 64 || !probe_id.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return Err("Nieprawidłowy format identyfikatora sondy".into());
    }
    
    // Bezpieczna, ograniczona odpowiedź
    Ok(format!("Telemetria dla węzła {}: STATUS_UZBROJONY_OK", probe_id))
}

#[command]
fn save_encrypted_vault(key: String, payload: Vec<u8>) -> Result<(), String> {
    if payload.len() > 10 * 1024 * 1024 {
        return Err("Ładunek przekracza bezpieczny próg pamięci 10MB".into());
    }
    // Bezpieczny trwały zapis odizolowany do katalogu aplikacji
    Ok(())
}`;

interface TauriInspectorProps {
  selectedModel?: AIModelId;
}

export const TauriInspector: React.FC<TauriInspectorProps> = ({ selectedModel }) => {
  const [tauriConf, setTauriConf] = useState(DEFAULT_TAURI_CONF);
  const [rustIpc, setRustIpc] = useState(DEFAULT_RUST_IPC);
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<TauriAuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCsp, setCopiedCsp] = useState(false);

  const runTauriAudit = async () => {
    playTerminalKeySound();
    setLoading(true);
    setErrorMessage(null);
    setAuditResult(null);

    try {
      const res = await fetch('/api/tauri-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tauriConfig: tauriConf,
          rustCode: rustIpc,
          model: selectedModel || 'gemini-3.8-flash',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      playSuccessSound();
      setAuditResult(data);
    } catch (err: any) {
      playAlertSound();
      setErrorMessage(err.message || 'Failed to complete Tauri audit');
    } finally {
      setLoading(false);
    }
  };

  const copyHardenedCsp = () => {
    const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' asset: data:; connect-src 'self' ipc: http://localhost:3000; frame-ancestors 'none'; object-src 'none';";
    navigator.clipboard.writeText(csp);
    setCopiedCsp(true);
    playBeep(900, 0.05);
    setTimeout(() => setCopiedCsp(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#0b0f19] font-sans text-xs overflow-y-auto">
      {/* Top Banner */}
      <div className="px-5 py-3 bg-[#0f1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm">Inspektor Bezpieczeństwa Tauri i Rust IPC</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono border border-slate-700">
                Macierz Uprawnień Tauri v2
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">Audyt natywnych poleceń Rust IPC, białych list zakresów i granic Content Security Policy (CSP)</p>
          </div>
        </div>

        <button
          onClick={runTauriAudit}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loading ? 'Analizowanie architektury Tauri...' : 'Audytuj aplikację Tauri'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-5 overflow-hidden">
        {/* Left column: Tauri Config & Rust IPC Code */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {/* Box 1: tauri.conf.json */}
          <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">tauri.conf.json / capabilities</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Konfiguracja bezpieczeństwa &amp; CSP</span>
            </div>
            <textarea
              value={tauriConf}
              onChange={(e) => setTauriConf(e.target.value)}
              className="flex-1 p-3.5 bg-[#090d16] text-slate-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-900/60"
              spellCheck={false}
            />
          </div>

          {/* Box 2: Rust IPC Commands */}
          <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Terminal className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">src-tauri/src/main.rs (Handlery #[tauri::command])</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Natywne granice IPC</span>
            </div>
            <textarea
              value={rustIpc}
              onChange={(e) => setRustIpc(e.target.value)}
              className="flex-1 p-3.5 bg-[#090d16] text-slate-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-900/60"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right column: Audit Results & Security Checklist */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200 text-xs">Stan Bezpieczeństwa Tauri</span>
            </div>

            <button
              onClick={copyHardenedCsp}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
            >
              {copiedCsp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCsp ? 'Skopiowano CSP!' : 'Kopiuj wzmocniony CSP'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-200 font-medium text-sm">
                  Audytowanie kanałów IPC Tauri i bramek deserializacji...
                </p>
                <p className="text-slate-400 text-xs max-w-sm">
                  Weryfikacja uprawnień, ochrona przed wstrzykiwaniem poleceń powłoki i zasady izolacji CSP.
                </p>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Komunikat audytu Tauri</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {errorMessage}
                </p>
                <button
                  onClick={runTauriAudit}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-md border border-rose-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Ponów audyt
                </button>
              </div>
            )}

            {!loading && !errorMessage && !auditResult && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#111927] border border-slate-800">
                  <h4 className="text-slate-200 font-semibold mb-1.5 flex items-center gap-2 text-xs">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Kluczowa lista kontrolna bezpieczeństwa dla aplikacji Tauri + Rust:
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Aplikacje Tauri łączą natywny plik binarny języka Rust z interfejsem Webview. Najbardziej krytycznym wektorem ataku jest podatność XSS w interfejsie webowym, eskalująca do wykonania dowolnego kodu na maszynie-hoście przez nieograniczone polecenia IPC lub wywołania powłoki (shell).
                  </p>
                </div>

                {/* Checklist preview */}
                <div className="space-y-2.5">
                  {[
                    { title: 'Rygorystyczna polityka bezpieczeństwa treści (CSP)', desc: 'Blokuj unsafe-eval, nieautoryzowane ładowanie zewnętrznych skryptów i ogranicz connect-src do ipc: oraz lokalnych punktów końcowych.', pass: true },
                    { title: 'Izolacja białej listy wykonywania powłoki (Shell)', desc: 'Nigdy nie włączaj shell:all. Unikaj przekazywania niezaufanych argumentów tekstowych do bash lub cmd.exe.', pass: true },
                    { title: 'Ograniczenie zakresu systemu plików (fs)', desc: 'Ogranicz dostęp do plików ściśle do ścieżek $APPDATA lub $RESOURCE. Nigdy nie dopuszczaj dowolnego trawersowania ścieżek.', pass: true },
                    { title: 'Kontrola granic i sprawdzanie typów w Rust', desc: 'Sanityzuj dane wejściowe serde w funkcjach #[tauri::command], weryfikuj długości ciągów i unikaj niesprawdzonych unwrap().', pass: true },
                    { title: 'Wzorzec izolacji okna (Window Isolation Pattern)', desc: 'W przypadku obciążeń o podwyższonym rygorze bezpieczeństwa użyj wzorca izolacji Tauri do przechwytywania komunikatów IPC za pomocą mostka kryptograficznego.', pass: false },
                  ].map((rule, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-200 text-xs block">{rule.title}</span>
                        <span className="text-slate-400 text-[11px] leading-relaxed">{rule.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={runTauriAudit}
                    className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Uruchom głęboki audyt bieżącej konfiguracji
                  </button>
                </div>
              </div>
            )}

            {!loading && auditResult && (
              <div className="space-y-4">
                {/* Score Card */}
                <div className="p-4 rounded-xl bg-[#111927] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Ocena Bezpieczeństwa Tauri</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-bold text-white font-mono">
                        {auditResult.score}
                        <span className="text-slate-500 text-base font-normal">/100</span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          auditResult.status === 'SECURE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : auditResult.status === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {auditResult.status === 'SECURE' ? 'BEZPIECZNA' : auditResult.status === 'WARNING' ? 'OSTRZEŻENIE' : 'KRYTYCZNY'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <span>Silnik audytu: </span>
                    <span className="text-slate-200 font-medium">WormSec Tauri Inspector</span>
                  </div>
                </div>

                {/* CSP Analysis */}
                {auditResult.cspAnalysis && (
                  <div className="p-3.5 rounded-xl bg-[#111927] border border-slate-800 space-y-1.5">
                    <span className="text-cyan-400 font-semibold text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      Ocena Polityki Bezpieczeństwa Treści (CSP)
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">{auditResult.cspAnalysis}</p>
                  </div>
                )}

                {/* IPC Risks */}
                {auditResult.ipcRisks && auditResult.ipcRisks.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#111927] border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                      Zidentyfikowane Ryzyka na Granicy IPC
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                      {auditResult.ipcRisks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Checklist */}
                {auditResult.hardeningChecklist && auditResult.hardeningChecklist.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">
                      Ewaluacja Zabezpieczeń Utwardzających (Hardening)
                    </span>
                    {auditResult.hardeningChecklist.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-start gap-2.5">
                        {item.passed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={`font-semibold text-xs block ${item.passed ? 'text-slate-200' : 'text-amber-300'}`}>
                            {item.item}
                          </span>
                          <span className="text-slate-400 text-[11px] leading-relaxed">{item.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#111927] border border-slate-800 space-y-2">
                    <span className="text-cyan-400 font-semibold text-xs block">
                      Zalecenia Taktyczne dla Środowiska Tauri:
                    </span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 text-xs">
                      {auditResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
