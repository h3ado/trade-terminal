import { useEffect, useMemo, useState } from 'react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useNewsQuiz, computeStreak, type QuizQuestion } from '@/hooks/useNewsQuiz';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Check, X, RotateCw, ExternalLink, Trophy } from 'lucide-react';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const CAT_COLOR: Record<string, string> = {
  Markets: 'hsl(var(--accent-orange))',
  Macro: 'hsl(var(--positive))',
  Geopolitics: 'hsl(var(--negative))',
  Energy: 'hsl(var(--accent))',
  Crypto: 'hsl(var(--warning, 45 90% 55%))',
  Corporate: 'hsl(var(--muted-foreground))',
};

export default function NewsQuiz() {
  const { privacyMode } = usePrivacy();
  const { data, loading, error, attempts, refetch, saveAttempt } = useNewsQuiz();

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ qid: string; choice: number; correct: boolean }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const questions: QuizQuestion[] = data?.questions ?? [];
  const q = questions[idx];

  const redact = (s: string | number) => privacyMode ? '•••' : String(s);

  // Keyboard
  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (!q) return;
      const k = e.key.toLowerCase();
      if (!submitted) {
        if (['1','2','3','4'].includes(k)) setSelected(parseInt(k, 10) - 1);
        if (['a','b','c','d'].includes(k)) setSelected('abcd'.indexOf(k));
        if (e.key === 'Enter' && selected !== null) handleSubmit();
      } else if (e.key === 'Enter') {
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleSubmit = () => {
    if (selected === null || !q) return;
    const correct = selected === q.answerIndex;
    setAnswers(a => [...a, { qid: q.id, choice: selected, correct }]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      // finish
      const finalAnswers = answers;
      const score = finalAnswers.filter(a => a.correct).length;
      if (data?.weekStart) saveAttempt(data.weekStart, score, finalAnswers);
      setDone(true);
      return;
    }
    setIdx(i => i + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const score = answers.filter(a => a.correct).length;
  const streak = useMemo(() => computeStreak(attempts), [attempts]);

  const catBreakdown = useMemo(() => {
    const byCat: Record<string, { correct: number; total: number }> = {};
    questions.forEach((qq, i) => {
      const a = answers[i];
      const entry = byCat[qq.category] ?? { correct: 0, total: 0 };
      entry.total++;
      if (a?.correct) entry.correct++;
      byCat[qq.category] = entry;
    });
    return Object.entries(byCat).map(([cat, v]) => ({ cat, pct: v.total ? Math.round((v.correct / v.total) * 100) : 0, total: v.total }));
  }, [questions, answers]);

  const restart = () => {
    setIdx(0); setSelected(null); setAnswers([]); setSubmitted(false); setDone(false);
  };

  // ── LOADING / ERROR ──
  if (loading && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-mono text-muted-foreground gap-2 bg-background">
        <div className="text-[10px] uppercase tracking-wider text-accent animate-pulse">Generating weekly quiz…</div>
        <div className="text-[9px]">Pulling last 7d of headlines · Lovable AI</div>
      </div>
    );
  }
  if (error || !data || questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-mono text-muted-foreground gap-3 bg-background">
        <div className="text-[10px] uppercase text-negative">Quiz unavailable</div>
        {error && <div className="text-[9px]">{error}</div>}
        <button onClick={() => refetch()} className="text-[10px] uppercase font-bold text-accent border border-accent px-2 py-1 hover:bg-accent hover:text-accent-foreground">
          <RotateCw className="w-3 h-3 inline mr-1" /> Retry
        </button>
      </div>
    );
  }

  const weekLabel = new Date(data.weekStart + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });

  // ── RESULTS ──
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const missed = questions.map((qq, i) => ({ qq, a: answers[i] })).filter(x => x.a && !x.a.correct);
    return (
      <div className="h-full overflow-y-auto bg-background text-foreground font-mono p-4">
        <div className="max-w-4xl mx-auto">
          <div className="border border-border bg-surface-deep p-4 mb-3">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
              <div className="text-[10px] uppercase tracking-wider text-accent font-bold">▌ Weekly News Quiz — Results · Week of {weekLabel}</div>
              <button onClick={restart} className="text-[9px] uppercase text-muted-foreground hover:text-accent flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Retake
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-[9px] uppercase text-muted-foreground">Score</div>
                <div className="text-3xl font-bold text-[hsl(var(--accent-orange))]">{redact(score)}<span className="text-base text-muted-foreground">/{questions.length}</span></div>
                <div className="text-[10px] text-muted-foreground">{redact(pct)}%</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-muted-foreground">Grade</div>
                <div className="text-3xl font-bold text-positive">
                  {pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F'}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-muted-foreground">Streak</div>
                <div className="text-3xl font-bold text-foreground flex items-center gap-1">
                  <Trophy className="w-5 h-5 text-[hsl(var(--accent-orange))]" />{redact(streak)}<span className="text-[10px] text-muted-foreground">wk</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-muted-foreground">Time</div>
                <div className="text-3xl font-bold text-foreground">{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border border-border bg-surface-deep p-3">
              <div className="text-[9px] uppercase text-accent font-bold mb-2">Category Breakdown</div>
              <ExpandableResponsiveContainer width="100%" height={160}>
                <BarChart data={catBreakdown}>
                  <XAxis dataKey="cat" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} stroke="hsl(var(--muted-foreground))" />
                  <Bar dataKey="pct">
                    {catBreakdown.map((c, i) => <Cell key={i} fill={CAT_COLOR[c.cat] ?? 'hsl(var(--accent))'} />)}
                  </Bar>
                </BarChart>
              </ExpandableResponsiveContainer>
            </div>

            <div className="border border-border bg-surface-deep p-3">
              <div className="text-[9px] uppercase text-accent font-bold mb-2">Recent Attempts</div>
              <div className="space-y-1 text-[10px]">
                {attempts.slice(0, 8).map(a => (
                  <div key={a.week_start} className="flex justify-between border-b border-grid-line py-0.5">
                    <span className="text-muted-foreground">{a.week_start}</span>
                    <span className="font-bold text-foreground">{redact(a.score)}/10</span>
                  </div>
                ))}
                {attempts.length === 0 && <div className="text-muted-foreground text-[9px]">No prior attempts</div>}
              </div>
            </div>
          </div>

          <div className="border border-border bg-surface-deep p-3">
            <div className="text-[9px] uppercase text-accent font-bold mb-2">Missed Questions ({missed.length})</div>
            <div className="space-y-2">
              {missed.length === 0 && <div className="text-[10px] text-positive">Perfect score — nothing missed.</div>}
              {missed.map(({ qq, a }) => (
                <div key={qq.id} className="border-l-2 border-negative pl-2 py-1">
                  <div className="text-[10px] text-foreground">{qq.question}</div>
                  <div className="text-[9px] mt-0.5">
                    <span className="text-negative">Your: {qq.choices[a.choice]}</span>
                    <span className="mx-2 text-border">│</span>
                    <span className="text-positive">Correct: {qq.choices[qq.answerIndex]}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground italic mt-0.5">{qq.explanation}</div>
                  {qq.sources?.[0] && (
                    <a href={qq.sources[0].url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-accent hover:underline inline-flex items-center gap-0.5 mt-0.5">
                      <ExternalLink className="w-2.5 h-2.5" />{qq.sources[0].domain}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION VIEW ──
  return (
    <div className="h-full overflow-y-auto bg-background text-foreground font-mono">
      {/* Header */}
      <div className="border-b border-border bg-surface-deep px-3 py-1.5 flex items-center gap-3 text-[10px]">
        <span className="text-[hsl(var(--accent-orange))] font-bold uppercase tracking-wider">▌ WEEKLY NEWS QUIZ</span>
        <span className="text-muted-foreground">Week of {weekLabel}</span>
        <span className="text-border">│</span>
        <span className="text-muted-foreground">Q <span className="text-foreground font-bold">{idx + 1}</span>/{questions.length}</span>
        <span className="text-border">│</span>
        <span className="text-muted-foreground">Score <span className="text-positive font-bold">{redact(score)}</span></span>
        <span className="text-border">│</span>
        <span className="text-muted-foreground">Streak <span className="text-[hsl(var(--accent-orange))] font-bold">{redact(streak)}w</span></span>
        <span className="ml-auto text-muted-foreground">⏱ {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</span>
      </div>

      <div className="grid grid-cols-[1fr_240px] gap-3 p-3">
        {/* Question card */}
        <div className="border border-border bg-surface-deep p-4">
          <div className="flex items-center gap-2 mb-3 text-[9px] uppercase">
            <span className="px-1.5 py-0.5 bg-accent/15 text-accent font-bold tracking-wider">{q.category}</span>
            <span className={`px-1.5 py-0.5 font-bold ${q.difficulty === 'Hard' ? 'bg-negative/15 text-negative' : q.difficulty === 'Medium' ? 'bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]' : 'bg-positive/15 text-positive'}`}>{q.difficulty}</span>
          </div>

          <div className="text-sm text-foreground mb-4 leading-snug">{q.question}</div>

          <div className="space-y-1.5">
            {q.choices.map((c, i) => {
              const isCorrect = submitted && i === q.answerIndex;
              const isWrong = submitted && i === selected && i !== q.answerIndex;
              const isSelected = selected === i;
              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-3 py-2 border text-[11px] flex items-center gap-2 transition-colors
                    ${isCorrect ? 'border-positive bg-positive/10 text-positive' : ''}
                    ${isWrong ? 'border-negative bg-negative/10 text-negative' : ''}
                    ${!submitted && isSelected ? 'border-accent bg-accent/10 text-foreground' : ''}
                    ${!submitted && !isSelected ? 'border-border text-foreground hover:border-accent/50 hover:bg-surface-elevated' : ''}
                    ${submitted && !isCorrect && !isWrong ? 'border-border text-muted-foreground' : ''}
                  `}
                >
                  <span className="text-[9px] font-bold w-4 text-muted-foreground">{'ABCD'[i]}</span>
                  <span className="flex-1">{c}</span>
                  {isCorrect && <Check className="w-3.5 h-3.5" />}
                  {isWrong && <X className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`mt-3 p-2 border-l-2 text-[10px] ${selected === q.answerIndex ? 'border-positive bg-positive/5 text-positive' : 'border-negative bg-negative/5 text-negative'}`}>
              <div className="font-bold uppercase tracking-wider mb-0.5">
                {selected === q.answerIndex ? '✓ Correct' : '✗ Wrong'}
              </div>
              <div className="text-foreground text-[10px]">{q.explanation}</div>
            </div>
          )}

          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={selected === null}
                className="px-3 py-1.5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit (↵)
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-3 py-1.5 bg-[hsl(var(--accent-orange))] text-background text-[10px] font-bold uppercase tracking-wider"
              >
                {idx + 1 >= questions.length ? 'Finish (↵)' : 'Next (↵)'}
              </button>
            )}
            <div className="ml-auto text-[9px] text-muted-foreground self-center">
              Keys: 1-4 / A-D · Enter
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-3">
          <div className="border border-border bg-surface-deep p-2">
            <div className="text-[9px] uppercase text-accent font-bold mb-1.5">Progress</div>
            <div className="grid grid-cols-10 gap-0.5">
              {questions.map((_, i) => {
                const a = answers[i];
                const cls = i === idx ? 'bg-accent' : a ? (a.correct ? 'bg-positive' : 'bg-negative') : 'bg-border';
                return <div key={i} className={`h-3 ${cls}`} title={`Q${i + 1}`} />;
              })}
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
              <span><span className="inline-block w-2 h-2 bg-positive mr-0.5" />correct</span>
              <span><span className="inline-block w-2 h-2 bg-negative mr-0.5" />wrong</span>
            </div>
          </div>

          {submitted && q.sources?.length > 0 && (
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] uppercase text-accent font-bold mb-1.5">Sources</div>
              <div className="space-y-1">
                {q.sources.slice(0, 4).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block text-[9px] hover:bg-surface-elevated p-1 border-l border-border">
                    <div className="text-foreground line-clamp-2">{s.title}</div>
                    <div className="text-accent flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-2.5 h-2.5" />{s.domain}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="border border-border bg-surface-deep p-2">
            <div className="text-[9px] uppercase text-accent font-bold mb-1.5">Stats</div>
            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Answered</span><span className="text-foreground">{redact(answers.length)}/{questions.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Correct</span><span className="text-positive">{redact(score)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Accuracy</span><span className="text-foreground">{redact(answers.length ? Math.round((score / answers.length) * 100) : 0)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Streak</span><span className="text-[hsl(var(--accent-orange))]">{redact(streak)}w</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
