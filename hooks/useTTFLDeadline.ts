import { useState, useEffect } from 'react';
import { formatDateString, getDateFromDaysAgo } from './useGames';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 6000);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(tid));
}

export function useTTFLDeadline() {
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const [isPastDeadline, setIsPastDeadline] = useState(false);
  const [hasGamesTonight, setHasGamesTonight] = useState(false);

  // Fetch le premier match du soir depuis ESPN
  useEffect(() => {
    async function fetchDeadline() {
      try {
        const dateStr = formatDateString(getDateFromDaysAgo(0));
        const res = await fetchWithTimeout(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`
        );
        if (!res.ok) return;
        const json = await res.json();
        const events: any[] = json?.events ?? [];
        if (events.length === 0) return;

        setHasGamesTonight(true);
        let earliest: Date | null = null;
        for (const e of events) {
          if (e.date) {
            const d = new Date(e.date);
            if (!earliest || d < earliest) earliest = d;
          }
        }
        if (earliest) setDeadline(earliest);
      } catch {}
    }
    fetchDeadline();
  }, []);

  // Compte à rebours
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setIsPastDeadline(true);
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
      setIsPastDeadline(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const deadlineLabel = deadline
    ? deadline.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    : null;

  return { deadline, deadlineLabel, timeLeft, isPastDeadline, hasGamesTonight };
}
