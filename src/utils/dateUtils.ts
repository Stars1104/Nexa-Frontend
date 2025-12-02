/**
 * Utility functions for date formatting
 * Handles timezone issues when formatting dates from backend (YYYY-MM-DD format)
 */

/**
 * Formats a date string to Brazilian format (dd/MM/yyyy)
 * Handles dates in YYYY-MM-DD format by creating Date in local timezone to avoid UTC conversion issues
 * 
 * @param dateString - Date string in format "YYYY-MM-DD" or ISO format
 * @returns Formatted date string in "dd/MM/yyyy" format
 */
export const formatDateBR = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Não especificada';
  
  try {
    // Check if date is in YYYY-MM-DD format (from backend)
    // If so, create Date in local timezone to avoid UTC conversion
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR');
    }
    
    // For other formats (ISO with time, etc.), use standard Date parsing
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

/**
 * Formats a date string using date-fns format
 * Handles dates in YYYY-MM-DD format by creating Date in local timezone
 * 
 * @param dateString - Date string in format "YYYY-MM-DD" or ISO format
 * @param formatStr - Format string for date-fns (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export const formatDateWithFns = (dateString: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!dateString) return 'Não especificada';
  
  try {
    // Check if date is in YYYY-MM-DD format (from backend)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      // Use date-fns format if available, otherwise fallback to toLocaleDateString
      if (typeof window !== 'undefined' && (window as any).dateFnsFormat) {
        return (window as any).dateFnsFormat(date, formatStr);
      }
      return date.toLocaleDateString('pt-BR');
    }
    
    // For other formats, use standard Date parsing
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

