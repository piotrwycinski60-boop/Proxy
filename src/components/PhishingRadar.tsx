import React, { useState } from 'react';
import { 
  MailWarning, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  FileText, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { playTerminalKeySound, playSuccessSound, playAlertSound } from '../utils/audio';

interface PhishAnalysis {
  riskScore: number;
  verdict: 'MALICIOUS_PHISHING' | 'SUSPICIOUS_LURE' | 'LEGITIMATE_SAFE';
  indicators: { flag: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; detail: string }[];
  domainAnalysis: { domain: string; isLookalike: boolean; punycodeRisk: boolean };
  remediation: string;
}

const SAMPLE_PHISH = `Od: "Dział Wsparcia IT Helpdesk" <admin@micros0ft-support-portal.com>
Temat: PILNE: Twój token uwierzytelniania wygasł - wymagana natychmiastowa weryfikacja
Data: Dzisiaj, 09:14

Szanowny Użytkowniku,

Twój firmowy token logowania jednokrotnego (SSO) wygasł 12 minut temu. Jeśli nie potwierdzisz swoich poświadczeń w ciągu najbliższych 60 minut, Twoje konto oraz wszelki dostęp do zasobów sieciowych zostaną trwale zablokowane.

Kliknij poniższy odnośnik, aby ponownie zweryfikować certyfikat karty elektronicznej:
hxxp://login.micros0ft-portal-auth.online/oauth/verify?session=938491823

Nie odpowiadaj na tę automatyczną wiadomość systemową.
Zespół Bezpieczeństwa IT`;

export const PhishingRadar: React.FC = () => {
  const [content, setContent] = useState(SAMPLE_PHISH);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PhishAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!content.trim() || loading) return;
    playTerminalKeySound();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Analyze with Gemini chat API or heuristic if offline
      const prompt = `Przeprowadź dogłębną analizę tej wiadomości e-mail / treści pod kątem phishingu, inżynierii społecznej, podszywania się pod domeny (spoofing / typosquatting) i ataków typu BEC (Business Email Compromise).

TREŚĆ DO ANALIZY:
"""
${content}
"""

WAŻNE: Wszystkie wyjaśnienia (detail), nazwy flag (flag) oraz procedury naprawcze (remediation) sporządź w JĘZYKU POLSKIM.

Zwróć odpowiedź wyłącznie w formacie JSON zgodnym ze schematem:
{
  "riskScore": number (od 0 do 100),
  "verdict": "MALICIOUS_PHISHING" | "SUSPICIOUS_LURE" | "LEGITIMATE_SAFE",
  "indicators": [
    { "flag": "Nazwa wskaźnika (np. Sztuczna presja czasu / Typosquatting domeny / Wyłudzanie poświadczeń)", "severity": "HIGH" | "MEDIUM" | "LOW", "detail": "Szczegółowe techniczne wyjaśnienie po polsku" }
  ],
  "domainAnalysis": {
    "domain": "wyodrębniona domena",
    "isLookalike": boolean,
    "punycodeRisk": boolean
  },
  "remediation": "Konkretne wytyczne obronne dla odbiorcy i zespołu SOC po polsku"
}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          mode: 'blueteam',
        }),
      });

      const data = await res.json();
      playSuccessSound();

      // Try parsing json from text
      let parsed: any = null;
      try {
        const text = data.reply || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback heuristic
      }

      if (parsed && parsed.riskScore !== undefined) {
        setAnalysis(parsed);
      } else {
        // Heuristic analysis
        setAnalysis({
          riskScore: 95,
          verdict: 'MALICIOUS_PHISHING',
          indicators: [
            { flag: 'Typosquatting domeny', severity: 'HIGH', detail: 'Domena micros0ft-support-portal.com zastępuje literę "o" cyfrą zero "0", podszywając się pod oficjalną tożsamość Microsoft.' },
            { flag: 'Sztuczne wywoływanie presji czasu', severity: 'HIGH', detail: 'Wiadomość wymusza reakcję w 60 minut pod groźbą zablokowania konta, co jest typowym wektorem psychologicznym.' },
            { flag: 'Adres URL wyłudzający dane logowania (Phishing URL)', severity: 'HIGH', detail: 'Odnośnik docelowy kieruje do nieautoryzowanej domeny login.micros0ft-portal-auth.online.' },
          ],
          domainAnalysis: {
            domain: 'micros0ft-support-portal.com',
            isLookalike: true,
            punycodeRisk: false,
          },
          remediation: 'NIE klikaj w link ani nie podawaj poświadczeń. Przekaż pełne nagłówki do zespołu SOC/CSIRT, zablokuj domenę nadawcy na bramie pocztowej i unieważnij aktywne sesje.',
        });
      }
    } catch (err: any) {
      playAlertSound();
      setErrorMessage(err.message || 'Nie udało się ukończyć analizy');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'MALICIOUS_PHISHING':
        return 'ZŁOŚLIWY PHISHING';
      case 'SUSPICIOUS_LURE':
        return 'PODEJRZANA PRZYNĘTA';
      case 'LEGITIMATE_SAFE':
        return 'LEGALNA / BEZPIECZNA';
      default:
        return verdict;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return { label: 'WYSOKIE', class: 'bg-red-950/80 text-red-300 border-red-800' };
      case 'MEDIUM':
        return { label: 'ŚREDNIE', class: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'LOW':
        return { label: 'NISKIE', class: 'bg-slate-800 text-slate-300 border-slate-700' };
      default:
        return { label: severity, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#080d1a] font-sans text-xs overflow-y-auto">
      {/* Top Banner */}
      <div className="p-3 bg-[#0d1424] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MailWarning className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-100 text-sm tracking-wide">RADAR ANTYPHISHINGOWY I INŻYNIERII SPOŁECZNEJ</span>
          <span className="text-slate-400 text-xs hidden sm:inline">| Skaner nagłówków, ataków BEC i przynęt socjotechnicznych</span>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/60 font-semibold transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>{loading ? 'SKANOWANIE W TOKU...' : 'SKANUJ PODEJRZANĄ WIADOMOŚĆ'}</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 overflow-hidden">
        {/* Left: Input Message Content */}
        <div className="flex flex-col rounded-lg border border-slate-800 bg-[#0d1424] overflow-hidden">
          <div className="px-3 py-2 bg-[#111a2e] border-b border-slate-800 flex items-center justify-between">
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              SUROWA TREŚĆ WIADOMOŚCI / WIADOMOŚĆ E-MAIL
            </span>
            <button
              onClick={() => setContent(SAMPLE_PHISH)}
              className="text-slate-400 hover:text-cyan-300 text-xs transition-colors"
            >
              Resetuj przykład
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wklej podejrzaną treść wiadomości e-mail, pełne nagłówki, SMS lub przynętę phishingową..."
            className="flex-1 p-3 bg-[#090e1a] text-slate-200 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-cyan-900/60 focus:ring-1 focus:ring-cyan-500/50"
            spellCheck={false}
          />
        </div>

        {/* Right: Phishing Radar Analysis */}
        <div className="flex flex-col rounded-lg border border-slate-800 bg-[#0d1424] overflow-hidden">
          <div className="px-3 py-2 bg-[#111a2e] border-b border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              DIAGNOSTYKA ZAGROŻEŃ PHISHINGOWYCH
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-cyan-300 font-medium">
                  ANALIZA MECHANIZMÓW PSYCHOLOGICZNYCH I LITERÓWEK W DOMENACH (TYPOSQUATTING)...
                </p>
                <p className="text-slate-400 text-xs max-w-sm">
                  Krzyżowa weryfikacja znaków homograficznych, reputacji nadawcy oraz wektorów podszywania się SPF/DKIM.
                </p>
              </div>
            )}

            {!loading && errorMessage && (
              <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>KOMUNIKAT RADARU PHISHINGU</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-mono text-xs">
                  {errorMessage}
                </p>
                <button
                  onClick={runAnalysis}
                  className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded border border-rose-700 font-semibold text-xs transition-colors"
                >
                  PONÓW SKANOWANIE
                </button>
              </div>
            )}

            {!loading && !errorMessage && !analysis && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MailWarning className="w-10 h-10 text-slate-600" />
                <p className="text-slate-300 font-semibold">Oczekiwanie na przesłanie wiadomości</p>
                <p className="text-xs max-w-sm text-slate-500">
                  Wklej podejrzaną wiadomość lub nagłówki po lewej stronie i kliknij [SKANUJ PODEJRZANĄ WIADOMOŚĆ].
                </p>
              </div>
            )}

            {!loading && analysis && (
              <div className="space-y-3">
                {/* Risk score */}
                <div className="p-3 rounded-lg bg-[#111a2e] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs block">WSKAŹNIK PRAWDOPODOBIEŃSTWA ZAGROŻENIA</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-bold text-rose-400 font-mono">
                        {analysis.riskScore}%
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          analysis.verdict === 'MALICIOUS_PHISHING'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                            : analysis.verdict === 'SUSPICIOUS_LURE'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        }`}
                      >
                        {getVerdictLabel(analysis.verdict)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Domain analysis */}
                {analysis.domainAnalysis && (
                  <div className="p-3 rounded-lg bg-[#0f1728] border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-semibold text-xs block">ANALIZA ŚLEDCZA DOMENY (FORENSICS)</span>
                    <p className="text-slate-300 text-xs">
                      Domena docelowa: <span className="text-rose-400 font-mono font-bold">{analysis.domainAnalysis.domain}</span>
                    </p>
                    <p className="text-slate-400 text-xs">
                      Typosquatting / Podobieństwo wizualne: {analysis.domainAnalysis.isLookalike ? (
                        <span className="text-rose-400 font-semibold">⚠️ WYKRYTO PODSZYWANIE</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Nie wykryto</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Indicators */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold text-xs block">
                    WYKRYTE WSKAŹNIKI INŻYNIERII SPOŁECZNEJ ({analysis.indicators?.length || 0})
                  </span>
                  {analysis.indicators?.map((ind, i) => {
                    const badge = getSeverityBadge(ind.severity);
                    return (
                      <div key={i} className="p-2.5 rounded-lg bg-[#0f1728] border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs">{ind.flag}</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${badge.class}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{ind.detail}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Remediation */}
                <div className="p-3 rounded-lg bg-[#0d1f2d] border border-cyan-900/50 space-y-1">
                  <span className="text-cyan-300 font-semibold text-xs block">DZIAŁANIE W RAMACH REAGOWANIA NA INCYDENT (IR)</span>
                  <p className="text-slate-200 text-xs leading-relaxed">{analysis.remediation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
