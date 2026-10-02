import { addDays, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';

/**
 * O dia de hoje (00:00, horário local). Atualiza sozinho na virada do dia,
 * para "vence hoje" e "atrasado" não ficarem errados com o app aberto à noite.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const msUntilTomorrow = addDays(today, 1).getTime() - Date.now();
    // +1s de folga para o timer não disparar ainda no dia anterior.
    const timer = window.setTimeout(() => setToday(startOfDay(new Date())), Math.max(msUntilTomorrow, 0) + 1000);
    return () => window.clearTimeout(timer);
  }, [today]);

  return today;
}
