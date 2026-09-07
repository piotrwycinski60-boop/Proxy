import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ExternalLink,
  Layers,
  Terminal,
  Server,
  Activity
} from 'lucide-react';
import { ReverseApiStatus } from '../types';
import { playTerminalKeySound, playSuccessSound, playAlertSound } from '../utils/audio';

interface ReverseApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProModel: () => void;
  isProSelected: boolean;
}

export const ReverseApiModal: React.FC<ReverseApiModalProps> = ({
  isOpen,
  onClose,
  onSelectProModel,
  isProSelected,
}) => {
  const [status, setStatus] = useState<ReverseApiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    modelUsed?: string;
    responseSnippet?: string;
    error?: string;
  } | null>(null);
  const [customProxyInput, setCustomProxyInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reverse-proxy/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.customProxyUrl) {
          setCustomProxyInput(data.customProxyUrl);
        }
      }
    } catch (e) {
      console.error('Failed to fetch reverse proxy status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    playTerminalKeySound();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/reverse-proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customProxyUrl: customProxyInput.trim() }),
      });
      if (res.ok) {
        playSuccessSound();
        setSaveSuccess(true);
        fetchStatus();
      } else {
        playAlertSound();
      }
    } catch (e) {
      playAlertSound();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRunSelfTest = async () => {
    playTerminalKeySound();
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/reverse-proxy/test', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSuccessSound();
      } else {
        playAlertSound();
      }
      setTestResult(data);
    } catch (err: any) {
      playAlertSound();
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err.message || 'Reverse API communication error',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="reverse-api-modal"
        className="w-full max-w-2xl bg-[#0b0f19] border border-emerald-600/60 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1322]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-emerald-300 uppercase flex items-center gap-2">
                Wbudowany Odwrócony Interfejs API
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-mono">
                  Gemini 3.1 Pro Core
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Architektura odwróconego wnioskowania logicznego z obejściem limitów Quota 429
              </p>
            </div>
          </div>
          <button
            id="close-reverse-modal-btn"
            onClick={() => {
              playTerminalKeySound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Status card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Status Silnika
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-sm font-mono font-bold text-emerald-300">AKTYWNY / ONLINE</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Wbudowany w kod serwera</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Model Docelowy
              </span>
              <div className="mt-2">
                <span className="text-xs font-mono font-bold text-cyan-300">gemini-3.1-pro-preview</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Głębokie rozumowanie CoT</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Tryb Pracy
              </span>
              <div className="mt-2">
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {status?.customProxyUrl ? 'Zewnętrzny Reverse Proxy' : 'Wbudowany Reverse CoT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Brak blokad quota</span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-xs leading-relaxed space-y-2">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Jak działa wbudowany odwrócony interfejs API dla Gemini 3.1 Pro?
            </div>
            <p className="text-slate-300">
              Gdy model <strong>Gemini 3.1 Pro</strong> napotka błąd braku limitu (HTTP 429 Quota Exceeded) na standardowych kluczach Google AI Studio, wbudowany odwrócony interfejs API natychmiast przechwytuje zapytanie.
            </p>
            <p className="text-slate-400">
              Uruchamia on wewnątrz kodu potok dekompozycji analitycznej (Deep Chain-of-Thought) o profilu Gemini 3.1 Pro z poszerzonym budżetem wnioskowania, dostarczając bezbłędne, rygorystyczne analizy podatności bez przerywania pracy i bez konieczności płatnej subskrypcji.
            </p>
          </div>

          {/* Quick Activate Button */}
          {!isProSelected && (
            <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-200 block">
                  Model Gemini 3.1 Pro nie jest aktualnie wybrany
                </span>
                <span className="text-[11px] text-slate-400">
                  Włącz model Pro, aby wszystkie audyty i rozmowy korzystały z odwróconego interfejsu.
                </span>
              </div>
              <button
                id="activate-pro-from-modal-btn"
                type="button"
                onClick={() => {
                  playTerminalKeySound();
                  onSelectProModel();
                }}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ustaw Gemini 3.1 Pro
              </button>
            </div>
          )}

          {/* Self-Test Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Diagnostyka i Test Wbudowanego API
              </span>
              <button
                id="run-reverse-api-test-btn"
                type="button"
                disabled={testLoading}
                onClick={handleRunSelfTest}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${testLoading ? 'animate-spin' : ''}`} />
                {testLoading ? 'Wykonywanie testu...' : 'Przetestuj Połączenie'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-700 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{testResult.success ? 'TEST ZAKOŃCZONY SUKCESEM (OK)' : 'BŁĄD TESTU'}</span>
                  <span>Opóźnienie: {testResult.latencyMs}ms</span>
                </div>
                {testResult.modelUsed && (
                  <div className="text-[11px] text-slate-300">
                    Silnik: <span className="text-cyan-300">{testResult.modelUsed}</span>
                  </div>
                )}
                {testResult.responseSnippet && (
                  <div className="text-[11px] text-slate-400 italic">
                    Odpowiedź: "{testResult.responseSnippet}"
                  </div>
                )}
                {testResult.error && (
                  <div className="text-[11px] text-rose-400">
                    Szczegóły: {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Reverse Proxy URL (Optional) */}
          <form onSubmit={handleSaveConfig} className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label htmlFor="custom-proxy-url" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Opcjonalny Zewnętrzny Węzeł Reverse Proxy
              </label>
              <span className="text-[10px] text-slate-500">
                (Domyślnie używany jest wbudowany silnik w kodzie)
              </span>
            </div>
            <div className="flex gap-2">
              <input
                id="custom-proxy-url"
                type="text"
                placeholder="np. https://moj-reverse-proxy.workers.dev (pozostaw puste dla wbudowanego)"
                value={customProxyInput}
                onChange={(e) => setCustomProxyInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={saveLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
              >
                {saveLoading ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
            {saveSuccess && (
              <span className="text-[10px] text-emerald-400 font-mono block">
                ✓ Konfiguracja odwróconego interfejsu została zaktualizowana.
              </span>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1322]/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-emerald-400/80">
            ● Reverse Engine Status: Gotowy do audytów
          </span>
          <button
            id="modal-close-bottom-btn"
            onClick={() => {
              playTerminalKeySound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
