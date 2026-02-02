/**
 * CSV parsing utilities and validation
 */

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  data: Record<string, any>[];
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
  validRows: number;
}

/**
 * Validate CSV data structure
 */
export function validateCSVData(
  data: Record<string, any>[],
  requiredColumns: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (data.length === 0) {
    errors.push({
      row: 0,
      column: '',
      value: null,
      message: 'CSV file is empty',
      severity: 'error',
    });
    return errors;
  }
  
  // Check for required columns
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  requiredColumns.forEach((col) => {
    if (!availableColumns.includes(col)) {
      errors.push({
        row: 0,
        column: col,
        value: null,
        message: `Required column "${col}" is missing`,
        severity: 'error',
      });
    }
  });
  
  return errors;
}

/**
 * Parse CSV file
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          resolve({
            data: [],
            errors: [{
              row: 0,
              column: '',
              value: null,
              message: 'File is empty',
              severity: 'error',
            }],
            warnings: [],
            totalRows: 0,
            validRows: 0,
          });
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data: Record<string, any>[] = [];
        const errors: ValidationError[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
        }
        
        resolve({
          data,
          errors,
          warnings: [],
          totalRows: data.length,
          validRows: data.length - errors.length,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
