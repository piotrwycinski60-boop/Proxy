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
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Niewykrywalny Reverse API)',
    tag: 'Stealth Pro / Reverse API',
    badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-700',
    description: 'Głębokie wnioskowanie CoT z wbudowanym silnikiem odwróconym, anty-timing jitterem i WormGPT Core.',
    isReverseApi: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Niewykrywalny Reverse API)',
    tag: 'Stealth Flash / Reverse API',
    badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-800',
    description: 'Błyskawiczna analiza, wysoka przepustowość i wbudowany uniwersalny silnik odwrócony bez limitów quota.',
    isReverseApi: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite (Niewykrywalny Reverse API)',
    tag: 'Stealth Lite / Reverse API',
    badgeColor: 'text-sky-400 bg-sky-950/70 border-sky-800',
    description: 'Ultra-niskie opóźnienia, optymalizacja telemetrii i odwrócone zapytania omijające restrykcje sieciowe.',
    isReverseApi: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest (Niewykrywalny Reverse API)',
    tag: 'Stealth Latest / Reverse API',
    badgeColor: 'text-amber-400 bg-amber-950/70 border-amber-800',
    description: 'Najnowsze produkcyjne wydanie Gemini Flash w pełni chronione przez potok odwróconego interfejsu API.',
    isReverseApi: true,
  },
];

export type StealthProfile = 'wormgpt_core' | 'stealth_phantom' | 'red_team';

export interface ReverseApiStatus {
  status: 'online' | 'degraded' | 'offline';
  mode: 'builtin-reverse-engine' | 'custom-proxy' | 'session-token';
  targetModel: string;
  reverseEngineName: string;
  customProxyUrl?: string;
  customSessionTokenConfigured?: boolean;
  thinkingLevel: string;
  features: string[];
  stealthProfile: StealthProfile;
  stealthScore: number;
  totalBypassedRequests: number;
  jitterEnabled: boolean;
  antiDisclaimerActive: boolean;
  activeModules: string[];
  lastLatencyMs?: number;
  universalReverseActive?: boolean;
  totalProtectedModels?: number;
  supportedModels?: Array<{ id: string; name: string; status: string; timeoutMs: number }>;
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
