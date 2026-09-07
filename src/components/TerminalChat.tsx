import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Download, 
  Terminal as TerminalIcon, 
  Copy, 
  Check, 
  Flame, 
  ShieldCheck, 
  Cpu, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  CornerDownLeft,
  ChevronRight,
  Shield,
  Layers,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, AIModelId } from '../types';
import { playTerminalKeySound, playBeep, playSuccessSound, playAlertSound } from '../utils/audio';

interface TerminalChatProps {
  selectedModel?: AIModelId;
}

export const TerminalChat: React.FC<TerminalChatProps> = ({ selectedModel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-init',
      role: 'system',
      text: 'INICJALIZACJA_SYSTEMU: Silnik wywiadu bezpieczeństwa WormGPT został uruchomiony. Docelowe środowisko wykonawcze: Tauri v2 (React + backend Rust IPC). Weryfikacja piaskownicy pomyślna.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'sys-welcome',
      role: 'model',
      text: `### 🛡️ WormGPT Cyber Intelligence Copilot\n\n` +
        `Stacja robocza gotowa do etycznych badań bezpieczeństwa, audytu podatności, utwardzania granic IPC w Tauri/Rust oraz analizy wektorów mitygacji exploitów.\n\n` +
        `**Dostępne wektory badawcze:**\n` +
        `- **Tauri & Rust IPC:** Audyt \`#[tauri::command]\`, kanonizacja ścieżek, granice deserializacji serde oraz matryca uprawnień (Capabilities).\n` +
        `- **Badania Red Team:** Mechanika inżynierii wstecznej plików binarnych, wektory eksploitacji pamięci oraz analiza POC.\n` +
        `- **Obrona Blue Team:** Utwardzanie kryptograficzne, reguły SIEM/SOC, konstrukcja polityk CSP i architektura Zero-Trust.\n\n` +
        `Wprowadź zapytanie poniżej lub wybierz scenariusz taktyczny z paska szybkiego dostępu.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cyberMode, setCyberMode] = useState<'redteam' | 'blueteam' | 'tauri' | 'codeaudit'>('redteam');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    playTerminalKeySound();

    if (textToSend === '/clear' || textToSend === 'clear') {
      setMessages([
        {
          id: 'sys-clear',
          role: 'system',
          text: 'Bufor sesji terminala został wyczyszczony. Pamięć podręczna zresetowana.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setInput('');
      return;
    }

    if (textToSend === '/help' || textToSend === 'help') {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          text: textToSend,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: `### 🛠️ Polecenia i Dyrektywy Terminala\n\n` +
            `| Polecenie | Działanie |\n` +
            `| :--- | :--- |\n` +
            `| \`/clear\` | Resetuje bufor bieżącej konsoli |\n` +
            `| \`/redteam\` | Przełącza na tryb analizy ofensywnej (Red Team) |\n` +
            `| \`/blueteam\` | Przełącza na tryb obrony i utwardzania (Blue Team) |\n` +
            `| \`/tauri\` | Przełącza na analizę granic Tauri v2 i Rust IPC |\n` +
            `| \`/export\` | Eksportuje pełny dziennik sesji do formatu Markdown |\n\n` +
            `Możesz także wkleić dowolny fragment kodu, identyfikator CVE (np. \`CVE-2024-3094\`) lub poprosić o strategię naprawczą.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      mode: cyberMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          mode: cyberMode,
          model: selectedModel || 'gemini-3.8-flash',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Serwer odrzucił zapytanie');
      }

      playSuccessSound();

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || '[BRAK STRUMIENIA ODPOWIEDZI Z SERWERA]',
        timestamp: new Date().toLocaleTimeString(),
        mode: cyberMode,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      playAlertSound();
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        text: `Błąd wykonania: ${err.message || 'Utracono połączenie z silnikiem bezpieczeństwa'}.`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playBeep(900, 0.05);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportLogs = () => {
    const content = messages
      .map((m) => `### [${m.timestamp}] ${m.role.toUpperCase()}\n\n${m.text}\n\n---\n`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wormgpt-sesja-bezpieczenstwa-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    playSuccessSound();
  };

  const quickPrompts = [
    { label: 'Podatności granic IPC w Tauri', query: 'Wykonaj kompleksowy audyt podatności aplikacji Tauri z backendem w Rust. Jakie są typowe ryzyka wstrzykiwania do IPC i jak skutecznie zabezpieczyć #[tauri::command]?' },
    { label: 'Utwardzone CSP dla frontendu Tauri i React', query: 'Wygeneruj wysoce zabezpieczoną politykę Content Security Policy (CSP) dla frontendu React/Vite wbudowanego w Tauri, aby zablokować eskalację z XSS do RCE.' },
    { label: 'Bezpieczeństwo pamięci w blokach unsafe (Rust)', query: 'Przeanalizuj typowe błędy przepełnienia bufora i arytmetyki wskaźników w blokach unsafe w języku Rust oraz metody ich eliminacji.' },
    { label: 'Mechanizmy obronne CFI i Shadow Stack', query: 'Wyjaśnij, w jaki sposób technologie Control Flow Integrity (CFI) oraz Shadow Stacks zapobiegają eksploatacji typu Return-Oriented Programming (ROP).' },
    { label: 'Metodologia deobfuskacji PowerShell / JS', query: 'Przedstaw bezpieczną, metodyczną procedurę analizowania i deobfuskacji złośliwych skryptów PowerShell oraz JavaScript w odizolowanym sandboxie.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#0b0f19] text-slate-200 relative overflow-hidden">
      {/* Control Bar: Security Vectors & Session Utilities */}
      <div className="px-5 py-2.5 bg-[#0f1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Wektor badań:</span>
          <div className="inline-flex rounded-lg border border-slate-700/80 bg-slate-900 p-0.5">
            <button
              id="mode-redteam-btn"
              onClick={() => {
                setCyberMode('redteam');
                playTerminalKeySound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                cyberMode === 'redteam'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Ofensywny (Red Team)</span>
            </button>

            <button
              id="mode-blueteam-btn"
              onClick={() => {
                setCyberMode('blueteam');
                playTerminalKeySound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                cyberMode === 'blueteam'
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Defensywny (Blue Team)</span>
            </button>

            <button
              id="mode-tauri-btn"
              onClick={() => {
                setCyberMode('tauri');
                playTerminalKeySound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                cyberMode === 'tauri'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tauri &amp; Rust IPC</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-session-btn"
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Eksportuj sesję (.md)</span>
          </button>
          <button
            id="clear-terminal-btn"
            onClick={() => handleSend('/clear')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wyczyść konsolę</span>
          </button>
        </div>
      </div>

      {/* Terminal message stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-sm">
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  msg.isError
                    ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}
              >
                {msg.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <TerminalIcon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="font-mono">{msg.text}</div>
              </div>
            );
          }

          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col rounded-xl border p-4 transition-all shadow-sm ${
                isUser
                  ? 'bg-slate-900/90 border-slate-700/80 ml-6 md:ml-16'
                  : 'bg-[#0f172a]/95 border-slate-800 mr-6 md:mr-16'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 ${
                      isUser
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                    }`}
                  >
                    {isUser ? (
                      <>
                        <TerminalIcon className="w-3 h-3 text-slate-400" />
                        <span>OPERATOR</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span>WORM_GPT_CORE</span>
                      </>
                    )}
                  </span>
                  {msg.mode && (
                    <span className="text-slate-500 font-mono text-[10px] uppercase">[{msg.mode}]</span>
                  )}
                  {msg.modelUsed && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        msg.modelUsed.includes('Odwrócony') || msg.modelUsed.includes('Reverse')
                          ? 'text-emerald-300 bg-emerald-950/70 border-emerald-700 shadow-sm'
                          : 'text-cyan-400/90 bg-cyan-950/40 border-cyan-800/60'
                      }`}
                    >
                      {msg.modelUsed.includes('Odwrócony') || msg.modelUsed.includes('Reverse') ? (
                        <Zap className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                      )}
                      {msg.modelUsed}
                    </span>
                  )}
                  <span className="text-slate-500 text-[11px] font-mono">{msg.timestamp}</span>
                </div>

                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className="hover:text-slate-200 text-slate-500 transition-colors p-1 flex items-center gap-1 text-[11px]"
                  title="Kopiuj wiadomość"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj</span>
                    </>
                  )}
                </button>
              </div>

              {/* Message Body */}
              <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed font-sans text-sm">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-semibold text-white mt-3 mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold text-slate-100 mt-2.5 mb-1.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-200 mt-2 mb-1 uppercase tracking-wider">{children}</h3>,
                    p: ({ children }) => <p className="mb-2.5 leading-relaxed text-slate-300">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-300">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-300">{children}</li>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-slate-900 border-b border-slate-800 text-slate-200">{children}</thead>,
                    th: ({ children }) => <th className="p-2.5 font-medium">{children}</th>,
                    td: ({ children }) => <td className="p-2.5 border-t border-slate-800/60 text-slate-300 font-mono text-xs">{children}</td>,
                    pre: ({ children }: any) => {
                      const codeEl = React.isValidElement(children) ? children : null;
                      const codeProps = codeEl ? (codeEl.props as any) : {};
                      const className = codeProps.className || '';
                      const match = /language-(\w+)/.exec(className);
                      const lang = match ? match[1].toUpperCase() : 'KOD';
                      const codeText = String(codeProps.children || children || '').replace(/\n$/, '');

                      return (
                        <div className="my-3 rounded-lg bg-[#090d16] border border-slate-800 overflow-hidden not-prose">
                          <div className="px-3.5 py-1.5 bg-[#0e1422] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span className="text-cyan-400 font-medium">{lang}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(codeText, codeText.slice(0, 10))}
                              className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Kopiuj kod</span>
                            </button>
                          </div>
                          <pre className="p-3.5 text-xs overflow-x-auto text-slate-200 font-mono bg-[#090d16] m-0 border-none leading-relaxed">
                            <code>{codeText}</code>
                          </pre>
                        </div>
                      );
                    },
                    code: ({ children, className, ...props }: any) => {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-mono">Przetwarzanie zapytania przez neuronowy silnik Gemini 3.8 Flash...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Tactical Scenarios Bar */}
      <div className="px-5 py-2 bg-[#0f1626] border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 text-xs whitespace-nowrap flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Scenariusze:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.query)}
            disabled={loading}
            className="whitespace-nowrap px-3 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-cyan-600/60 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Terminal Input Bar */}
      <div className="p-3.5 bg-[#0d1322] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 bg-slate-900 rounded-lg border border-slate-700 px-3.5 py-2.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all"
        >
          <span className="text-slate-400 font-mono font-medium text-xs select-none">
            sec@workstation:~$
          </span>
          <input
            ref={inputRef}
            id="terminal-prompt-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.length % 5 === 0) {
                playTerminalKeySound();
              }
            }}
            placeholder="Zadaj pytanie dotyczące bezpieczeństwa, przetestuj IPC w Rust lub wpisz polecenie (/help, /clear)..."
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm font-sans"
          />
          <button
            id="terminal-send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <span>Wyślij</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-slate-500">
          <span>Wciśnij <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">Enter</kbd>, aby zatwierdzić</span>
          <span className="font-mono text-slate-400">Środowisko: Klient Tauri React + Rdzeń Rust</span>
        </div>
      </div>
    </div>
  );
};
