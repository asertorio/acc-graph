import { resolvePersonName } from '../utils/personResolver';
import { resolveLookup } from '../utils/lookupRegistry';

export function formatFieldValue(
  value: string,
  dataType: string,
  isPersonField: boolean,
  enrichedLookup?: string,
): string {
  if (!value || value === '') return '—';

  if (isPersonField) {
    return resolvePersonName(value);
  }

  if (enrichedLookup) {
    return resolveLookup(enrichedLookup, value) ?? value;
  }

  if (dataType.startsWith('timestamp')) {
    return formatTimestamp(value);
  }

  if (dataType === 'boolean') {
    return value === 't' || value === 'true' || value === '1' ? 'Yes' : 'No';
  }

  return value;
}

function formatTimestamp(value: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
