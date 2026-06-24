import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export interface QuizQuestion {
  id: string;
  category: 'Markets' | 'Macro' | 'Geopolitics' | 'Energy' | 'Crypto' | 'Corporate';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  sources: { title: string; domain: string; url: string; seendate: string }[];
}

export interface QuizPayload {
  weekStart: string;
  questions: QuizQuestion[];
  generatedAt: string;
  cached?: boolean;
}

export interface QuizAttempt {
  week_start: string;
  score: number;
  completed_at: string;
}

export function useNewsQuiz() {
  const [data, setData] = useState<QuizPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const fetchQuiz = useCallback(async (weekStart?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = weekStart ? { weekStart } : {};
      const res = await apiGet<QuizPayload>('/api/market/news/quiz', params);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Quiz fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttempts = useCallback(async () => {
    try {
      const rows = await apiGet<{ weekStart: string; score: number; completedAt: string }[]>('/api/quiz-attempts');
      setAttempts(rows.map(r => ({ week_start: r.weekStart, score: r.score, completed_at: r.completedAt })));
    } catch { /* not logged in */ }
  }, []);

  const saveAttempt = useCallback(async (weekStart: string, score: number, answers: unknown) => {
    try {
      await apiPost('/api/quiz-attempts', { weekStart, score, answers });
      fetchAttempts();
    } catch { /* ignore */ }
  }, [fetchAttempts]);

  useEffect(() => {
    fetchQuiz();
    fetchAttempts();
  }, [fetchQuiz, fetchAttempts]);

  return { data, loading, error, attempts, refetch: fetchQuiz, saveAttempt };
}

export function computeStreak(attempts: QuizAttempt[]): number {
  if (!attempts.length) return 0;
  const weeks = new Set(attempts.map(a => a.week_start));
  // count consecutive weeks back from most-recent attempt
  const sorted = [...weeks].sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = (prev.getTime() - cur.getTime()) / (7 * 24 * 3600 * 1000);
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}
