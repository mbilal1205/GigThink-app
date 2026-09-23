'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Sparkles,
  Target,
  Wallet,
  Flame,
  Users,
  Zap,
  ArrowRight,
  AlertCircle,
  History,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  ListChecks,
  Gauge,
  BadgeCheck,
  Loader2,
} from 'lucide-react';

export default function ParserPage() {
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const router = useRouter();

  const handleParse = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setLeadId(null);
    try {
      const payload: any = {
        saveToHistory,
      };
      if (inputMode === 'text') {
        if (!text.trim()) throw new Error('Please paste job text');
        payload.text = text;
      } else {
        if (!url.trim()) throw new Error('Please enter URL');
        payload.url = url;
      }

      const res = await fetch('/api/parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse');
      }

      const data = await res.json();
      setResult(data.result);
      if (data.leadId) setLeadId(data.leadId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!leadId) return;
    setGeneratingProposal(true);
    try {
      const res = await fetch('/api/parser/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate proposal');
      }
      const data = await res.json();
      // Redirect to project proposal page if projectId available, else to proposals list
      if (data.projectId) {
        router.push(`/projects/${data.projectId}/proposal`);
      } else {
        router.push('/proposals'); // fallback
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const scoreColor = (score: number | null | undefined) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen w-full hero-glow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center p-3 glass rounded-2xl brand-border mb-2 brand-glow">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold heading-gradient pb-1">
            AI Lead Parser
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Paste any job post or URL to instantly extract requirements, budget insights, and client intent.
          </p>
        </div>

        {/* Input Card */}
        <div className="glass rounded-2xl p-6 sm:p-8 brand-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

          {/* Toggle Controls */}
          <div className="flex bg-muted/50 p-1 rounded-xl w-fit mb-6 border border-border">
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'text'
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Raw Text
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'url'
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              Job URL
            </button>
          </div>

          {/* Input Fields */}
          <div className="mb-6">
            {inputMode === 'text' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Paste the full job description here..."
                className="w-full bg-input/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none transition-colors"
              />
            ) : (
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://upwork.com/jobs/..."
                className="w-full bg-input/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 text-foreground placeholder:text-muted-foreground transition-colors"
              />
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={saveToHistory}
                  onChange={() => setSaveToHistory(!saveToHistory)}
                  className="peer appearance-none w-5 h-5 border-2 border-muted-foreground rounded bg-transparent checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Save to History
              </span>
            </label>

            <button
              onClick={handleParse}
              disabled={loading || (inputMode === 'text' ? !text : !url)}
              className="w-full sm:w-auto btn-gradient text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Parse Job
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Results Dashboard */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Analysis Result
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/parser/history')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary text-sm font-medium"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                {leadId && (
                  <button
                    onClick={handleGenerateProposal}
                    disabled={generatingProposal}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                  >
                    {generatingProposal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Generate Proposal
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summary Span 3 cols */}
              <div className="md:col-span-3 glass p-6 rounded-2xl brand-border card-hover">
                <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Executive Summary</p>
                <p className="text-foreground leading-relaxed">{result.summary}</p>
              </div>

              {/* Score Highlights */}
              <div className="glass p-5 rounded-xl brand-border card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Fit Score</p>
                </div>
                <p className={`text-3xl font-bold ${scoreColor(result.fit_score)}`}>
                  {result.fit_score ? `${result.fit_score}%` : 'N/A'}
                </p>
              </div>
              <div className="glass p-5 rounded-xl brand-border card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">Win Probability</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {result.win_probability ? `${result.win_probability}%` : 'N/A'}
                </p>
              </div>
              <div className="glass p-5 rounded-xl brand-border card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                  <p className="text-sm font-medium text-muted-foreground">Client Score</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {result.client_score ? `${result.client_score}/100` : 'N/A'}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="glass p-5 rounded-xl brand-border card-hover flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Budget</p>
                  <p className="text-lg font-semibold mt-1">
                    {result.budget_min && result.budget_max
                      ? `$${result.budget_min} - $${result.budget_max}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="glass p-5 rounded-xl brand-border card-hover flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Urgency</p>
                  <p className="text-lg font-semibold mt-1 capitalize">{result.urgency}</p>
                </div>
              </div>

              <div className="glass p-5 rounded-xl brand-border card-hover flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Competition</p>
                  <p className="text-lg font-semibold mt-1 capitalize">{result.competition_estimate}</p>
                </div>
              </div>

              {/* Skills & Intent */}
              <div className="md:col-span-2 glass p-6 rounded-2xl brand-border card-hover">
                <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {result.skills?.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-2xl brand-border card-hover">
                <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Client Intent</p>
                <p className="text-foreground capitalize">{result.intent}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Quality Signal</p>
                  <p className="font-semibold capitalize">{result.client_quality}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Sentiment</p>
                  <p className="font-semibold capitalize">{result.sentiment}</p>
                </div>
              </div>

              {/* Requirements & Pain Points */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-6 rounded-2xl brand-border card-hover">
                  <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Key Requirements</p>
                  <ul className="space-y-3">
                    {result.requirements_summary?.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/90">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {result.pain_points?.length > 0 && (
                  <div className="glass p-6 rounded-2xl brand-border card-hover">
                    <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Pain Points Solved</p>
                    <ul className="space-y-3">
                      {result.pain_points.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/90">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Hidden Requirements & Competitive Landscape */}
              {result.hidden_requirements?.length > 0 && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass p-6 rounded-2xl brand-border card-hover">
                    <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Hidden Requirements</p>
                    <ul className="space-y-3">
                      {result.hidden_requirements.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass p-6 rounded-2xl brand-border card-hover">
                    <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Competitive Landscape</p>
                    <p className="text-sm text-foreground/90">{result.competitive_landscape}</p>
                  </div>
                </div>
              )}

              {/* Recommended Approach & Proposal Outline */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-6 rounded-2xl brand-border card-hover">
                  <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Recommended Approach</p>
                  <p className="text-sm text-foreground/90">{result.recommended_approach}</p>
                </div>
                {result.proposal_outline?.length > 0 && (
                  <div className="glass p-6 rounded-2xl brand-border card-hover">
                    <p className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Proposal Outline</p>
                    <ol className="space-y-2">
                      {result.proposal_outline.map((section: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground/90">{section}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="md:col-span-3 flex justify-end pt-4 gap-3">
                <button
                  onClick={() => router.push('/feed')}
                  className="group flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Go to Feed
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}