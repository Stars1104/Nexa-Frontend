export const isTranslationActive = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hasGoogleTranslateFrame = document.querySelector('.goog-te-banner-frame') !== null;
  const hasSkiptranslate = document.body.classList.contains('skiptranslate');
  const hasGoogleTranslateScript = document.querySelector('script[src*="translate.googleapis.com"]') !== null;
  
  const htmlLang = document.documentElement.getAttribute('lang');
  const bodyLang = document.body.getAttribute('lang');
  const hasLangMismatch = htmlLang && bodyLang && htmlLang !== bodyLang;

  const hasTranslationMarkers = document.querySelector('[data-translate]') !== null ||
                                 document.querySelector('.goog-te-spinner-pos') !== null;

  return hasGoogleTranslateFrame || hasSkiptranslate || hasGoogleTranslateScript || 
         hasLangMismatch || hasTranslationMarkers;
};

export const cleanupTranslationArtifacts = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const translateBanner = document.querySelector('.goog-te-banner-frame');
    if (translateBanner) {
      translateBanner.remove();
    }

    const spinner = document.querySelector('.goog-te-spinner-pos');
    if (spinner) {
      spinner.remove();
    }

    document.body.classList.remove('skiptranslate');

    const translateScripts = document.querySelectorAll('script[src*="translate.googleapis.com"]');
    translateScripts.forEach(script => script.remove());

    const originalLang = document.documentElement.getAttribute('data-original-lang') || 'pt-BR';
    if (document.documentElement.getAttribute('lang') !== originalLang) {
      document.documentElement.setAttribute('lang', originalLang);
    }

    const translatedElements = document.querySelectorAll('[data-translate]');
    translatedElements.forEach(el => {
      el.removeAttribute('data-translate');
    });
  } catch (error) {
    console.warn('Error cleaning up translation artifacts:', error);
  }
};

export const disableTranslation = (): void => {
  if (typeof window === 'undefined') return;

  try {
    document.body.classList.add('notranslate');
    document.documentElement.classList.add('notranslate');

    document.documentElement.setAttribute('translate', 'no');
    document.body.setAttribute('translate', 'no');

    const currentLang = document.documentElement.getAttribute('lang') || 'pt-BR';
    document.documentElement.setAttribute('data-original-lang', currentLang);

    cleanupTranslationArtifacts();
  } catch (error) {
    console.warn('Error disabling translation:', error);
  }
};

export const isTranslationError = (error: Error | string): boolean => {
  const errorMessage = typeof error === 'string' ? error : error.message || error.toString();
  const errorStack = typeof error === 'string' ? '' : error.stack || '';

  const translationKeywords = [
    'translate',
    'goog-te',
    'skiptranslate',
    'translation',
    'hydration',
    'mismatch',
    'Minified React error',
    'Text content does not match',
    'Hydration failed'
  ];

  const combinedText = `${errorMessage} ${errorStack}`.toLowerCase();
  
  return translationKeywords.some(keyword => combinedText.includes(keyword.toLowerCase()));
};

export const reloadWithoutTranslation = (): void => {
  if (typeof window === 'undefined') return;

  disableTranslation();
  
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.toLowerCase().includes('translate')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing translation storage:', error);
  }

  window.location.reload();
};

export const translateWithdrawalStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'processing': 'Processando',
    'completed': 'Concluído',
    'failed': 'Falhou',
    'cancelled': 'Cancelado',
  };
  return statusMap[status.toLowerCase()] || status;
};

export const translateTransactionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'processing': 'Processando',
    'paid': 'Pago',
    'completed': 'Concluído',
    'failed': 'Falhou',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'expired': 'Expirado',
  };
  return statusMap[status.toLowerCase()] || status;
};
