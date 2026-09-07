export type TabMode = 'terminal' | 'code-audit' | 'tauri-inspector' | 'threat-intel' | 'phishing-radar';

export type AIModelId = 'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-flash-latest';

export interface AIModelOption {
  id: AIModelId;
  name: string;
  tag: string;
  badgeColor: string;
  description: string;
  isReverseApi?: boolean;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Domyślny / Szybki',
    badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-800',
    description: 'Wysoka wydajność, zrównoważone wnioskowanie i natychmiastowe odpowiedzi.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Odwrócony API)',
    tag: 'Wbudowany Odwrócony API',
    badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-700',
    description: 'Wbudowany w kod odwrócony interfejs API (Reverse Engine & Deep CoT) bez blokad quota 429.',
    isReverseApi: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Ultra-szybki',
    badgeColor: 'text-sky-400 bg-sky-950/70 border-sky-800',
    description: 'Minimalne opóźnienia, optymalny do zapytań telemetrii i szybkiego prototypowania.',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    tag: 'Wersja bieżąca',
    badgeColor: 'text-amber-400 bg-amber-950/70 border-amber-800',
    description: 'Najświeższe wydanie kanału produkcyjnego Gemini Flash.',
  },
];

export interface ReverseApiStatus {
  status: 'online' | 'degraded' | 'offline';
  mode: 'builtin-reverse-engine' | 'custom-proxy' | 'session-token';
  targetModel: string;
  reverseEngineName: string;
  customProxyUrl?: string;
  customSessionTokenConfigured?: boolean;
  thinkingLevel: string;
  features: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  mode?: string;
  modelUsed?: string;
  isError?: boolean;
}

export interface CodeFinding {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cwe: string;
  line: string;
  description: string;
  recommendation: string;
}

export interface CodeAuditResult {
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
  summary: string;
  findings: CodeFinding[];
  secureVersion: string;
}

export interface TauriHardeningItem {
  item: string;
  passed: boolean;
  details: string;
}

export interface TauriAuditResult {
  score: number;
  status: 'SECURE' | 'WARNING' | 'CRITICAL' | 'OFFLINE_HEURISTIC';
  cspAnalysis: string;
  ipcRisks: string[];
  hardeningChecklist: TauriHardeningItem[];
  recommendations: string[];
}

export interface ThreatItem {
  id: string;
  cve: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  cvss: number;
  category: string;
  mitreTactic: string;
  description: string;
  mitigation: string;
}
