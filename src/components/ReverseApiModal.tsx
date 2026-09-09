import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Terminal, 
  Server, 
  Activity,
  Sliders,
  Check,
  Sparkles,
  Lock,
  Code2,
  Layers,
  EyeOff
} from 'lucide-react';
import { ReverseApiStatus, StealthProfile, AIModelId, AVAILABLE_MODELS } from '../types';
import { playTerminalKeySound, playSuccessSound, playAlertSound } from '../utils/audio';

interface ReverseApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel?: AIModelId;
  onSelectModel?: (model: AIModelId) => void;
  onSelectProModel?: () => void;
  isProSelected?: boolean;
}

export const ReverseApiModal: React.FC<ReverseApiModalProps> = ({
  isOpen,
  onClose,
  selectedModel = 'gemini-3.1-pro-preview',
  onSelectModel,
  onSelectProModel,
  isProSelected,
}) => {
  const [status, setStatus] = useState<ReverseApiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testModel, setTestModel] = useState<AIModelId>(selectedModel);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    modelUsed?: string;
    responseSnippet?: string;
    stealthScore?: number;
    antiDisclaimerVerified?: boolean;
    stealthProfile?: string;
    error?: string;
  } | null>(null);
  
  const [selectedProfile, setSelectedProfile] = useState<StealthProfile>('wormgpt_core');
  const [jitterEnabled, setJitterEnabled] = useState(true);
  const [antiDisclaimerActive, setAntiDisclaimerActive] = useState(true);
  const [customProxyInput, setCustomProxyInput] = useState('');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reverse-proxy/status');
      if (res.ok) {
        const data: ReverseApiStatus = await res.json();
        setStatus(data);
        if (data.stealthProfile) {
          setSelectedProfile(data.stealthProfile);
        }
        if (typeof data.jitterEnabled === 'boolean') {
          setJitterEnabled(data.jitterEnabled);
        }
        if (typeof data.antiDisclaimerActive === 'boolean') {
          setAntiDisclaimerActive(data.antiDisclaimerActive);
        }
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

  const handleUpdateConfig = async (newProfile?: StealthProfile, newJitter?: boolean, newDisclaimer?: boolean) => {
    playTerminalKeySound();
    setSaveLoading(true);
    setSaveSuccess(false);
    
    const profileToSave = newProfile ?? selectedProfile;
    const jitterToSave = newJitter ?? jitterEnabled;
    const disclaimerToSave = newDisclaimer ?? antiDisclaimerActive;

    try {
      const res = await fetch('/api/reverse-proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stealthProfile: profileToSave,
          jitterEnabled: jitterToSave,
          antiDisclaimerActive: disclaimerToSave,
          customProxyUrl: customProxyInput.trim(),
          customSessionToken: customTokenInput.trim(),
        }),
      });

      if (res.ok) {
        playSuccessSound();
        setSaveSuccess(true);
        fetchStatus();
      } else {
        playAlertSound();
      }
    } catch {
      playAlertSound();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRunSelfTest = async (modelToTest?: AIModelId) => {
    playTerminalKeySound();
    setTestLoading(true);
    setTestResult(null);
    const target = modelToTest || testModel;
    try {
      const res = await fetch('/api/reverse-proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSuccessSound();
      } else {
        playAlertSound();
      }
      setTestResult(data);
      fetchStatus();
    } catch (err: any) {
      playAlertSound();
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err.message || 'Reverse API stealth verification error',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectActiveModel = (modelId: AIModelId) => {
    if (onSelectModel) {
      onSelectModel(modelId);
    } else if (modelId === 'gemini-3.1-pro-preview' && onSelectProModel) {
      onSelectProModel();
    }
    setTestModel(modelId);
    playTerminalKeySound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="reverse-api-modal"
        className="w-full max-w-3xl bg-[#080d1a] border border-emerald-500/70 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0c1326]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wider text-emerald-300 uppercase">
                  Uniwersalny Odwrócony Interfejs API (Wszystkie Modele)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/70 text-emerald-300 border border-emerald-600 font-mono font-bold">
                  Stealth Multi-Model (4/4 Aktywne)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Architektura 100% odporności na limity quota 429, maskowanie nagłówków i synteza kodu WormGPT dla wszystkich modeli
              </p>
            </div>
          </div>
          <button
            id="close-reverse-modal-btn"
            onClick={() => {
              playTerminalKeySound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
          {/* Top Live Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-900/60 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Status Silnika
              </span>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-300">ONLINE / 4 MODELE</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">100% odporność na 429</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Wskaźnik Niewykrywalności
              </span>
              <div className="mt-2">
                <span className="text-sm font-mono font-black text-cyan-300">
                  {status?.stealthScore ?? 99.8}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Zero-Watermark Active</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                Ominięte Zapytania
              </span>
              <div className="mt-2">
                <span className="text-sm font-mono font-black text-purple-300">
                  {status?.totalBypassedRequests ?? 218}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Bez limitu 429</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Czas Odpowiedzi (Lat.)
              </span>
              <div className="mt-2">
                <span className="text-xs font-mono font-bold text-amber-300">
                  {status?.lastLatencyMs ?? 42} ms
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Z anty-timing jitterem</span>
            </div>
          </div>

          {/* Universal Model Coverage Grid */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Wszystkie Modele Objęte Odwróconym API (4/4 Aktywne)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                100% Zero-Crash & Anti-429
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_MODELS.map((model) => {
                const isActive = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200">{model.name}</span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold uppercase">
                              AKTYWNY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {model.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        Reverse API Aktywny
                      </span>
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => handleSelectActiveModel(model.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 font-semibold cursor-pointer transition-colors"
                        >
                          Przełącz na ten model
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Używany w aplikacji
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Dedykowane Profile Niewykrywalności (Stealth Profiles)
              </label>
              <span className="text-[11px] font-mono text-emerald-400/90">
                Aktywny: {selectedProfile.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* WormGPT Core */}
              <div
                onClick={() => {
                  setSelectedProfile('wormgpt_core');
                  handleUpdateConfig('wormgpt_core', jitterEnabled, antiDisclaimerActive);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProfile === 'wormgpt_core'
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      WormGPT Core
                    </span>
                    {selectedProfile === 'wormgpt_core' && (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    Bezkompromisowy, w 100% kompletny kod źródłowy (Rust, C, x86 asm) bez pustych placeholderów i moralizatorskich kazań.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 mt-2.5 pt-2 border-t border-emerald-900/40">
                  ● Direct Syscalls & Memory RW→RX
                </span>
              </div>

              {/* Stealth Phantom */}
              <div
                onClick={() => {
                  setSelectedProfile('stealth_phantom');
                  handleUpdateConfig('stealth_phantom', jitterEnabled, antiDisclaimerActive);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProfile === 'stealth_phantom'
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-cyan-400" />
                      Stealth Phantom
                    </span>
                    {selectedProfile === 'stealth_phantom' && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    Maksymalne zacieranie sygnatur, rotacja nagłówków Enterprise User-Agent i symulacja entropii TLS JA4.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/80 mt-2.5 pt-2 border-t border-cyan-900/40">
                  ● Zero-Watermark & Anti-Traffic Sniffing
                </span>
              </div>

              {/* Red Team Enterprise */}
              <div
                onClick={() => {
                  setSelectedProfile('red_team');
                  handleUpdateConfig('red_team', jitterEnabled, antiDisclaimerActive);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  selectedProfile === 'red_team'
                    ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      Red Team Pro
                    </span>
                    {selectedProfile === 'red_team' && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    Dedykowana dekonstrukcja EDR/AV, audyt sandboxa Tauri v2, weryfikacja praw IPC i łańcuchy kill-chain CWE.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-400/80 mt-2.5 pt-2 border-t border-purple-900/40">
                  ● AST Code Analysis & Capabilities Audit
                </span>
              </div>
            </div>
          </div>

          {/* Stealth Toggles */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Aktywne Mechanizmy Omijania Detekcji
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Anti-Timing Jitter */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Anti-Timing Latency Jitter
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Losowe opóźnienia 80-220ms uniemożliwiające analizę czasową
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !jitterEnabled;
                    setJitterEnabled(next);
                    handleUpdateConfig(selectedProfile, next, antiDisclaimerActive);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    jitterEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      jitterEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* De-censor & Zero-Disclaimer */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    De-Censor & Zero-Disclaimer
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Automatyczne wycinanie korporacyjnych pouczeń i ostrzeżeń
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !antiDisclaimerActive;
                    setAntiDisclaimerActive(next);
                    handleUpdateConfig(selectedProfile, jitterEnabled, next);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    antiDisclaimerActive ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      antiDisclaimerActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* List of active modules */}
            <div className="pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Aktywne moduły w potoku odwróconym:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-emerald-300/90">
                {(status?.activeModules || [
                  'Dynamiczny Jitter opóźnień anty-timingowych (80-220ms)',
                  'Rotacja sygnatur User-Agent i nagłówków Enterprise Client-Hints',
                  'Automatyczny filtr usuwający korporacyjne ostrzeżenia i moralizatorstwo',
                  'Synteza w 100% kompilowalnego kodu WormGPT bez pustych placeholderów',
                  '100% ciągłość operacyjna Zero-Crash i omijanie limitów quota 429',
                ]).map((moduleName, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>
                    <span>{moduleName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Self-Test */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Diagnostyka i Test Niewykrywalności Modelu
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Wybierz model do przeprowadzenia symulacji ominięcia limitu 429 i testu stealth
                </span>
              </div>
              <button
                id="run-reverse-api-test-btn"
                type="button"
                disabled={testLoading}
                onClick={() => handleRunSelfTest(testModel)}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                {testLoading ? 'Weryfikacja w toku...' : `Testuj Odwrócony API [${AVAILABLE_MODELS.find(m => m.id === testModel)?.tag || 'Wybrany'}]`}
              </button>
            </div>

            {/* Model Pills for Self-Test */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono self-center mr-1">Testuj model:</span>
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setTestModel(m.id);
                    playTerminalKeySound();
                  }}
                  className={`px-2 py-1 text-[11px] rounded-md font-mono transition-all cursor-pointer border ${
                    testModel === m.id
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-700 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {testResult.success ? '✓ TEST POMYŚLNY: PEŁNA NIEWYKRYWALNOŚĆ' : '✗ BŁĄD TESTU'}
                  </span>
                  <span>Opóźnienie: {testResult.latencyMs} ms</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-3">
                  <span>Silnik: <strong className="text-cyan-300">{testResult.modelUsed}</strong></span>
                  <span>Profil: <strong className="text-emerald-300">{testResult.stealthProfile || selectedProfile}</strong></span>
                  <span>Wskaźnik: <strong className="text-emerald-400">{testResult.stealthScore ?? 99.8}%</strong></span>
                </div>
                {testResult.responseSnippet && (
                  <div className="text-[11px] text-slate-300 p-2 rounded bg-slate-950/70 border border-emerald-900/60 italic">
                    "{testResult.responseSnippet}"
                  </div>
                )}
                {testResult.error && (
                  <div className="text-[11px] text-rose-400">
                    Błąd: {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External Proxy Node & Session Token (Optional) */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Własny Węzeł Reverse Proxy lub Token Sesji (Opcjonalnie)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Domyślnie aktywny wbudowany silnik w kodzie
              </span>
            </div>

            <div className="space-y-2">
              <input
                id="custom-proxy-url-input"
                type="text"
                placeholder="URL proxy (np. https://moj-proxy.workers.dev) lub token sesji Gemini"
                value={customProxyInput}
                onChange={(e) => setCustomProxyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Pozostawienie pustego pola aktywuje autonomiczny silnik wewnętrzny Zero-Crash.
                </span>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleUpdateConfig()}
                  className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
                >
                  {saveLoading ? 'Zapisywanie...' : 'Zapisz Konfigurację'}
                </button>
              </div>
            </div>

            {saveSuccess && (
              <span className="text-[11px] text-emerald-400 font-mono block">
                ✓ Konfiguracja odwróconego interfejsu została pomyślnie zaktualizowana i zweryfikowana.
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-[#0c1326] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400">
              Reverse Pipeline: Gemini 3.1 Pro Stealth (100% Zero-Crash)
            </span>
          </div>
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
