/**
 * Utility functions to detect and handle browser translation issues
 */

/**
 * Check if browser translation is currently active
 */
export const isTranslationActive = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Google Translate indicators
  const hasGoogleTranslateFrame = document.querySelector('.goog-te-banner-frame') !== null;
  const hasSkiptranslate = document.body.classList.contains('skiptranslate');
  const hasGoogleTranslateScript = document.querySelector('script[src*="translate.googleapis.com"]') !== null;
  
  // Check for language attribute changes (translation often changes this)
  const htmlLang = document.documentElement.getAttribute('lang');
  const bodyLang = document.body.getAttribute('lang');
  const hasLangMismatch = htmlLang && bodyLang && htmlLang !== bodyLang;

  // Check for translation markers in DOM
  const hasTranslationMarkers = document.querySelector('[data-translate]') !== null ||
                                 document.querySelector('.goog-te-spinner-pos') !== null;

  return hasGoogleTranslateFrame || hasSkiptranslate || hasGoogleTranslateScript || 
         hasLangMismatch || hasTranslationMarkers;
};

/**
 * Clean up translation artifacts from the DOM
 */
export const cleanupTranslationArtifacts = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Remove Google Translate banner
    const translateBanner = document.querySelector('.goog-te-banner-frame');
    if (translateBanner) {
      translateBanner.remove();
    }

    // Remove translation spinner
    const spinner = document.querySelector('.goog-te-spinner-pos');
    if (spinner) {
      spinner.remove();
    }

    // Remove skiptranslate class from body
    document.body.classList.remove('skiptranslate');

    // Remove translation scripts
    const translateScripts = document.querySelectorAll('script[src*="translate.googleapis.com"]');
    translateScripts.forEach(script => script.remove());

    // Reset language attributes if they were modified
    const originalLang = document.documentElement.getAttribute('data-original-lang') || 'pt-BR';
    if (document.documentElement.getAttribute('lang') !== originalLang) {
      document.documentElement.setAttribute('lang', originalLang);
    }

    // Remove translation data attributes
    const translatedElements = document.querySelectorAll('[data-translate]');
    translatedElements.forEach(el => {
      el.removeAttribute('data-translate');
    });
  } catch (error) {
    console.warn('Error cleaning up translation artifacts:', error);
  }
};

/**
 * Disable translation on the page
 */
export const disableTranslation = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Add notranslate class to body and html
    document.body.classList.add('notranslate');
    document.documentElement.classList.add('notranslate');

    // Set translate="no" attribute
    document.documentElement.setAttribute('translate', 'no');
    document.body.setAttribute('translate', 'no');

    // Store original language
    const currentLang = document.documentElement.getAttribute('lang') || 'pt-BR';
    document.documentElement.setAttribute('data-original-lang', currentLang);

    // Clean up existing translation artifacts
    cleanupTranslationArtifacts();
  } catch (error) {
    console.warn('Error disabling translation:', error);
  }
};

/**
 * Check if an error is related to browser translation
 */
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

/**
 * Reload page without translation
 */
export const reloadWithoutTranslation = (): void => {
  if (typeof window === 'undefined') return;

  // Disable translation before reload
  disableTranslation();
  
  // Clear any translation-related localStorage/sessionStorage
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

  // Reload the page
  window.location.reload();
};

/**
 * Translate withdrawal status from English to Portuguese
 */
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

/**
 * Translate transaction status from English to Portuguese
 */
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

