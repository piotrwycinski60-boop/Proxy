import React, { useState, useEffect } from 'react';
import { TabMode, AIModelId } from './types';
import { Header } from './components/Header';
import { TerminalChat } from './components/TerminalChat';
import { CodeAuditor } from './components/CodeAuditor';
import { TauriInspector } from './components/TauriInspector';
import { ThreatIntel } from './components/ThreatIntel';
import { PhishingRadar } from './components/PhishingRadar';
import { CyberBackground } from './components/CyberBackground';
import { ReverseApiModal } from './components/ReverseApiModal';
import { setSoundEnabled } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabMode>('terminal');
  const [sound, setSound] = useState(false);
  const [scanlines, setScanlines] = useState(false);
  const [matrixRain, setMatrixRain] = useState(true);
  const [geminiConnected, setGeminiConnected] = useState(true);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(() => {
    try {
      const saved = localStorage.getItem('wormgpt_selected_model');
      if (
        saved === 'gemini-3.8-flash' ||
        saved === 'gemini-3.1-pro-preview' ||
        saved === 'gemini-3.1-flash-lite' ||
        saved === 'gemini-flash-latest'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'gemini-3.8-flash';
  });

  const handleSelectModel = (model: AIModelId) => {
    setSelectedModel(model);
    try {
      localStorage.setItem('wormgpt_selected_model', model);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  useEffect(() => {
    // Check health & Gemini status
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.geminiConfigured !== undefined) {
          setGeminiConnected(data.geminiConfigured);
        }
      })
      .catch(() => {
        setGeminiConnected(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 relative flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Subtle Background Network Mesh */}
      <CyberBackground active={matrixRain} opacity={0.5} />

      {/* Main Professional Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={sound}
        setSoundEnabled={setSound}
        scanlines={scanlines}
        setScanlines={setScanlines}
        matrixRain={matrixRain}
        setMatrixRain={setMatrixRain}
        geminiConnected={geminiConnected}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        onOpenReverseModal={() => setIsReverseModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 relative z-10 flex flex-col">
        {activeTab === 'terminal' && <TerminalChat selectedModel={selectedModel} />}
        {activeTab === 'code-audit' && <CodeAuditor selectedModel={selectedModel} />}
        {activeTab === 'tauri-inspector' && <TauriInspector selectedModel={selectedModel} />}
        {activeTab === 'threat-intel' && <ThreatIntel />}
        {activeTab === 'phishing-radar' && <PhishingRadar />}
      </main>

      {/* Reverse API Modal */}
      <ReverseApiModal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        onSelectProModel={() => handleSelectModel('gemini-3.1-pro-preview')}
        isProSelected={selectedModel === 'gemini-3.1-pro-preview'}
      />

      {/* Executive Security Status Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16]/90 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Platforma Wywiadu Cybernetycznego WormGPT</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Architektura Tauri v2 + Rust</span>
          <span className="text-slate-700">|</span>
          <button
            type="button"
            onClick={() => setIsReverseModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            ⚡ Odwrócony API Gemini 3.1 Pro (Wbudowany w kod)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden sm:inline">
            Autoryzowana stacja robocza do testów penetracyjnych i defensywnych badań bezpieczeństwa
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            POUFNE // SEC-OPS
          </span>
        </div>
      </footer>
    </div>
  );
}
