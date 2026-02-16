import { useState } from 'react';
import type { SchemaColumn } from '../data/schemas/types';
import { formatFieldValue, isUuidLike } from './fieldFormatters';
import { formatFieldName } from '../utils/fieldConfig';

interface Props {
  fieldName: string;
  value: string;
  schema?: SchemaColumn;
  isPersonField: boolean;
  enrichedLookup?: string;
}

export function EntityFieldRenderer({ fieldName, value, schema, isPersonField, enrichedLookup }: Props) {
  const [expanded, setExpanded] = useState(false);

  const dataType = schema?.data_type ?? 'string';
  const formatted = formatFieldValue(value, dataType, isPersonField, enrichedLookup);
  const displayName = formatFieldName(fieldName, !!enrichedLookup);
  const isLong = formatted.length > 120;
  const displayValue = isLong && !expanded ? formatted.slice(0, 120) + '...' : formatted;
  const isEmpty = !value || value === '';

  return (
    <div className="py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-500 min-w-[140px] shrink-0 pt-0.5" title={fieldName}>
          {displayName}
        </span>
        <span
          className={`text-sm break-all ${
            isEmpty
              ? 'text-gray-300 italic'
              : isUuidLike(value)
              ? 'font-mono text-xs text-gray-600'
              : dataType === 'boolean'
              ? ''
              : 'text-gray-800'
          }`}
        >
          {dataType === 'boolean' && !isEmpty ? (
            <span
              className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                formatted === 'Yes'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {formatted}
            </span>
          ) : (
            displayValue
          )}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-xs text-blue-500 hover:text-blue-700"
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </span>
      </div>
      {schema?.notes && (
        <p className="text-[10px] text-gray-400 ml-[148px] mt-0.5">{schema.notes}</p>
      )}
    </div>
  );
}
