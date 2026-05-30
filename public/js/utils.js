export function formatMatchDate(value) {
  if (!value) return 'TBD';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function showMessage(container, message, type = 'info') {
  if (!container) return;
  container.textContent = message;
  container.className = `status-panel status-${type}`;
}

export function makeLogEntry(text) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  return `[${timestamp}] ${text}`;
}
