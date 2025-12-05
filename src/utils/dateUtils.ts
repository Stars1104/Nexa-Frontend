export const formatDateBR = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Não especificada';
  
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR');
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

export const formatDateWithFns = (dateString: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!dateString) return 'Não especificada';
  
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (typeof window !== 'undefined' && (window as any).dateFnsFormat) {
        return (window as any).dateFnsFormat(date, formatStr);
      }
      return date.toLocaleDateString('pt-BR');
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};
