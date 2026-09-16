export const DEFAULT_PERIOD_TIMINGS = [
  { period: 1, startTime: '11:10', endTime: '11:50', label: 'Period 1 (11:10 - 11:50)' },
  { period: 2, startTime: '11:50', endTime: '12:25', label: 'Period 2 (11:50 - 12:25)' },
  { period: 3, startTime: '12:25', endTime: '01:00', label: 'Period 3 (12:25 - 01:00)' },
  { period: 4, startTime: '01:00', endTime: '01:35', label: 'Period 4 (01:00 - 01:35)' },
  { period: 5, startTime: '02:00', endTime: '02:35', label: 'Period 5 (02:00 - 02:35)' },
  { period: 6, startTime: '02:35', endTime: '03:10', label: 'Period 6 (02:35 - 03:10)' },
  { period: 7, startTime: '03:10', endTime: '03:45', label: 'Period 7 (03:10 - 03:45)' },
  { period: 8, startTime: '03:45', endTime: '04:20', label: 'Period 8 (03:45 - 04:20)' }
];

export const getSavedPeriodTimings = () => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('custom_period_timings') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved period timings:', e);
  }
  return DEFAULT_PERIOD_TIMINGS;
};

export const PERIOD_TIMINGS = getSavedPeriodTimings();

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DAY_NAMES_MARATHI = {
  Monday: 'सोमवार',
  Tuesday: 'मंगळवार',
  Wednesday: 'बुधवार',
  Thursday: 'गुरूवार',
  Friday: 'शुक्रवार',
  Saturday: 'शनिवार'
};

export const ROLES = {
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
};

/**
 * Calculates current live bell period based on exact local time
 */
export const getLiveBellPeriodInfo = (now = new Date(), timings = PERIOD_TIMINGS) => {
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const totalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  // Sunday weekly holiday check
  if (now.getDay() === 0) {
    return {
      period: 0,
      liveStatus: 'holiday',
      label: 'रविवार साप्ताहिक सुट्टी (Sunday Holiday)',
      timing: '-'
    };
  }

  const list = timings && timings.length > 0 ? timings : DEFAULT_PERIOD_TIMINGS;

  // Parse all periods with 12h -> 24h conversion into seconds
  const parsed = list.map((p, idx) => {
    const [sh, sm] = (p.startTime || '11:00').split(':').map(Number);
    const [eh, em] = (p.endTime || '12:00').split(':').map(Number);
    const startH = sh < 8 ? sh + 12 : sh;
    const endH = eh < 8 ? eh + 12 : eh;
    return {
      ...p,
      startSec: startH * 3600 + sm * 60,
      endSec: endH * 3600 + em * 60,
      isLast: idx === list.length - 1
    };
  });

  const schoolStart = parsed[0].startSec;             // 11:10 AM
  const schoolEnd = parsed[parsed.length - 1].endSec; // 04:20 PM
  const recessStart = (13 * 60 + 35) * 60;            // 01:35 PM
  const recessEnd = (14 * 60) * 60;                   // 02:00 PM

  if (totalSeconds < schoolStart) {
    return {
      period: parsed[0].period,
      liveStatus: 'before',
      label: 'शाळा सुरू होणार (School Starts Soon)',
      timing: '11:10 AM'
    };
  }

  if (totalSeconds >= schoolEnd) {
    return {
      period: parsed[parsed.length - 1].period,
      liveStatus: 'after',
      label: 'आजचे सत्र संपले (School Closed for Today)',
      timing: '04:20 PM'
    };
  }

  // Lunch Recess
  if (totalSeconds >= recessStart && totalSeconds < recessEnd) {
    return {
      period: 5,
      liveStatus: 'recess',
      label: 'दुपारची मोठी सुट्टी (Lunch Recess)',
      timing: '01:35 PM – 02:00 PM'
    };
  }

  // Exact period matching
  for (const p of parsed) {
    if (totalSeconds >= p.startSec && (p.isLast ? totalSeconds <= p.endSec : totalSeconds < p.endSec)) {
      return {
        period: p.period,
        liveStatus: 'in_session',
        label: `तासिका क्र. ${p.period} (Period ${p.period})`,
        timing: `${p.startTime} – ${p.endTime}`
      };
    }
  }

  return {
    period: 1,
    liveStatus: 'in_session',
    label: 'तासिका क्र. 1 (Period 1)',
    timing: '11:10 – 11:50'
  };
};

