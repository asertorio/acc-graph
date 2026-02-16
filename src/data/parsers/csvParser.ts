import Papa from 'papaparse';

export interface CsvParseResult {
  data: Record<string, string>[];
  headers: string[];
  errors: Papa.ParseError[];
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsvText(text: string): CsvParseResult {
  const cleaned = stripBom(text);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  return {
    data: result.data,
    headers: result.meta.fields ?? [],
    errors: result.errors,
  };
}

export async function parseCsvFile(file: File): Promise<CsvParseResult> {
  const text = await file.text();
  return parseCsvText(text);
}
