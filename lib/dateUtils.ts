import { Event } from '@/app/types/calendar'

export function getMonthRange(events: Event[]) {
  if (events.length === 0) {
    const now = new Date()
    return {
      start: now,
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    }
  }

  const dates = events.map((event) => event.start)
  const minDate = new Date(Math.min.apply(null, dates))
  const maxDate = new Date(Math.max.apply(null, dates))

  if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
    return {
      start: minDate,
      end: new Date(minDate.getFullYear(), minDate.getMonth() + 1, 1),
    }
  } else {
    return {
      start: minDate,
      end: maxDate,
    }
  }
}

