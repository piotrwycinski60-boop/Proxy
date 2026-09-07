import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  ShieldAlert, 
  Cpu, 
  Radar, 
  MailWarning, 
  Volume2, 
  VolumeX, 
  Binary, 
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';
import { TabMode, AIModelId, AVAILABLE_MODELS } from '../types';
import { playTerminalKeySound } from '../utils/audio';

interface HeaderProps {
  activeTab: TabMode;
  setActiveTab: (tab: TabMode) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  scanlines: boolean;
  setScanlines: (enabled: boolean) => void;
  matrixRain: boolean;
  setMatrixRain: (enabled: boolean) => void;
  geminiConnected: boolean;
  selectedModel: AIModelId;
  onSelectModel: (model: AIModelId) => void;
  onOpenReverseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  matrixRain,
  setMatrixRain,
  geminiConnected,
  selectedModel,
  onSelectModel,
  onOpenReverseModal,
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const navTabs: { id: TabMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'terminal', label: 'Terminal Bezpieczeństwa', icon: <Terminal className="w-4 h-4" /> },
    { id: 'code-audit', label: 'Audytor Kodu SAST', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'tauri-inspector', label: 'Inspektor Tauri & Rust', icon: <Cpu className="w-4 h-4" />, badge: 'IPC' },
    { id: 'threat-intel', label: 'Radar Zagrożeń CVE', icon: <Radar className="w-4 h-4" /> },
    { id: 'phishing-radar', label: 'Ochrona Przed Phishingiem', icon: <MailWarning className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0d121f]/95 backdrop-blur-md z-20 sticky top-0">
      {/* Top telemetry banner */}
      <div className="px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SOC OPERACYJNY
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Host: <span className="text-slate-200 font-mono">Tauri v2 (React + Rust)</span></span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 inline-flex items-center gap-1.5 relative">
            <span>Silnik:</span>
            <div className="relative inline-block" ref={modelMenuRef}>
              <button
                id="model-selector-btn"
                type="button"
                onClick={() => {
                  setIsModelMenuOpen(!isModelMenuOpen);
                  playTerminalKeySound();
                }}
                className={`font-mono text-[11px] font-medium inline-flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer border transition-all ${
                  geminiConnected
                    ? 'text-cyan-300 bg-cyan-950/60 border-cyan-800/80 hover:bg-cyan-900/70 hover:border-cyan-600'
                    : 'text-amber-300 bg-amber-950/60 border-amber-800/80 hover:bg-amber-900/70'
                }`}
                title="Kliknij, aby przełączyć model AI"
              >
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>
                  {geminiConnected ? currentModel.name : 'Lokalny Tryb Heurystyczny'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                    isModelMenuOpen ? 'rotate-180 text-cyan-300' : ''
                  }`}
                />
              </button>

              {/* Model selection dropdown */}
              {isModelMenuOpen && (
                <div
                  id="model-selector-dropdown"
                  className="absolute left-0 top-full mt-2 w-80 rounded-lg bg-[#0f172a] border border-cyan-800/80 shadow-2xl p-2.5 z-50 backdrop-blur-md"
                >
                  <div className="px-2 py-1 border-b border-slate-800 mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Wybór Modelu Neuronowego
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      Gemini SDK
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {AVAILABLE_MODELS.map((model) => {
                      const isSelected = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          id={`model-option-${model.id}`}
                          type="button"
                          onClick={() => {
                            onSelectModel(model.id);
                            setIsModelMenuOpen(false);
                            playTerminalKeySound();
                          }}
                          className={`w-full text-left p-2 rounded-md transition-all flex flex-col gap-1 border ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-600 text-cyan-100 shadow-sm'
                              : 'bg-slate-900/60 border-transparent hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              {isSelected ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />
                              )}
                              {model.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${model.badgeColor}`}>
                              {model.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">
                            {model.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 px-1 flex flex-col gap-1.5 text-[10px]">
                    <button
                      id="open-reverse-api-from-menu-btn"
                      type="button"
                      onClick={() => {
                        setIsModelMenuOpen(false);
                        onOpenReverseModal?.();
                        playTerminalKeySound();
                      }}
                      className="w-full text-center py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 flex items-center justify-center gap-1.5 cursor-pointer font-medium transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Diagnostyka Odwróconego API Gemini 3.1 Pro
                    </button>
                    <span className="text-slate-500 text-center">Wszystkie zapytania kierowane są do wybranego modelu</span>
                  </div>
                </div>
              )}
            </div>
          </span>
          <span className="text-slate-700">|</span>
          <button
            id="reverse-api-indicator-btn"
            type="button"
            onClick={() => {
              onOpenReverseModal?.();
              playTerminalKeySound();
            }}
            className="font-mono text-[11px] inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-700/80 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 transition-all cursor-pointer shadow-sm"
            title="Wbudowany Odwrócony Interfejs API dla Gemini 3.1 Pro – kliknij, aby otworzyć diagnostykę i konfigurację"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>ODWRÓCONY API 3.1 PRO: AKTYWNY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playTerminalKeySound();
            }}
            title={soundEnabled ? 'Wyłącz sprzężenie dźwiękowe' : 'Włącz sprzężenie dźwiękowe'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
              soundEnabled
                ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{soundEnabled ? 'Dźwięk aktywny' : 'Wyciszony'}</span>
          </button>

          {/* Ambient Mesh background toggle */}
          <button
            id="matrix-toggle-btn"
            onClick={() => {
              setMatrixRain(!matrixRain);
              playTerminalKeySound();
            }}
            title={matrixRain ? 'Wyłącz animowaną siatkę' : 'Włącz animowaną siatkę'}
            className={`p-1.5 rounded text-xs border transition-colors ${
              matrixRain
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-slate-800 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                WormGPT
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                  Wywiad Cybernetyczny
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Stacja robocza DevSecOps: audyt podatności, analiza kodu i bezpieczeństwo Tauri/Rust
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  playTerminalKeySound();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
