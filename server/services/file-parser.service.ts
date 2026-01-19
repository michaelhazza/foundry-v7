/**
 * File parser service for CSV, XLSX, and JSON files.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FieldInfo {
  name: string;
  path: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  sampleValues: unknown[];
  nullCount: number;
  uniqueCount: number;
}

interface ParseResult {
  recordCount: number;
  fields: FieldInfo[];
  data: Record<string, unknown>[];
}

function detectDataType(values: unknown[]): 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return 'string';

  const sample = nonNullValues[0];

  if (Array.isArray(sample)) return 'array';
  if (typeof sample === 'object') return 'object';
  if (typeof sample === 'boolean') return 'boolean';
  if (typeof sample === 'number') return 'number';

  // Check if string looks like a number
  const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
  if (numericCount === nonNullValues.length) return 'number';

  // Check if string looks like a date
  const dateCount = nonNullValues.filter(v => {
    const date = new Date(v as string);
    return !isNaN(date.getTime());
  }).length;
  if (dateCount === nonNullValues.length && dateCount > 0) return 'date';

  return 'string';
}

function analyzeFields(data: Record<string, unknown>[]): FieldInfo[] {
  if (data.length === 0) return [];

  const fields = new Map<string, unknown[]>();

  // Collect values for each field
  for (const record of data) {
    for (const [key, value] of Object.entries(record)) {
      if (!fields.has(key)) {
        fields.set(key, []);
      }
      fields.get(key)!.push(value);
    }
  }

  // Analyze each field
  const fieldInfos: FieldInfo[] = [];
  for (const [name, values] of fields) {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues.map(v => JSON.stringify(v)));

    fieldInfos.push({
      name,
      path: name,
      dataType: detectDataType(values),
      sampleValues: nonNullValues.slice(0, 5),
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.size,
    });
  }

  return fieldInfos;
}

export async function parseFile(buffer: Buffer, fileType: 'csv' | 'xlsx' | 'json'): Promise<ParseResult> {
  let data: Record<string, unknown>[];

  switch (fileType) {
    case 'csv':
      data = await parseCsv(buffer);
      break;
    case 'xlsx':
      data = parseXlsx(buffer);
      break;
    case 'json':
      data = parseJson(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  const fields = analyzeFields(data);

  return {
    recordCount: data.length,
    fields,
    data,
  };
}

async function parseCsv(buffer: Buffer): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(buffer.toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as Record<string, unknown>[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

function parseXlsx(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
}

function parseJson(buffer: Buffer): Record<string, unknown>[] {
  const content = buffer.toString('utf-8');
  const parsed = JSON.parse(content);

  // Handle both array and object with array property
  if (Array.isArray(parsed)) {
    return parsed;
  }

  // Look for common array properties
  for (const key of ['data', 'records', 'items', 'results']) {
    if (Array.isArray(parsed[key])) {
      return parsed[key];
    }
  }

  // Wrap single object in array
  return [parsed];
}
