// <input type="datetime-local"> works in local time with no timezone
// suffix, while t_start is persisted as a UTC ISO string; these convert
// between the two without losing the user's intended wall-clock time.
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
