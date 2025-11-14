import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/index.ts'
import { Elements } from '@stripe/react-stripe-js'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import { isTranslationError, cleanupTranslationArtifacts, disableTranslation } from './utils/translationUtils'

// Simple loading component for persistence
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Global error handlers to prevent uncaught promise rejections
const setupGlobalErrorHandlers = () => {
  // Disable translation on page load
  disableTranslation();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if it's a translation-related error
    if (isTranslationError(error)) {
      console.warn('Erro relacionado à tradução detectado, limpando artefatos...', error);
      cleanupTranslationArtifacts();
      // Don't prevent default for translation errors - let ErrorBoundary handle it
      return;
    }
    
    console.warn('Rejeição de promessa não tratada:', event.reason);
    // Prevent the default browser behavior (showing error in console)
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    
    // Check if it's a translation-related error
    if (isTranslationError(error)) {
      console.warn('Erro de tradução detectado, limpando artefatos...', error);
      cleanupTranslationArtifacts();
      // Try to recover by reloading without translation
      if (event.error && event.error.message?.includes('hydration')) {
        // For hydration errors, suggest reload
        console.warn('Erro de hidratação detectado. Considere recarregar a página sem tradução.');
      }
      return;
    }
    
    console.warn('Erro global:', event.error);
    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle console errors to prevent them from showing as uncaught
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if this is a translation-related error
    const errorMessage = args.join(' ');
    if (isTranslationError(errorMessage)) {
      console.warn('Erro de tradução detectado no console:', errorMessage);
      cleanupTranslationArtifacts();
      return;
    }
    
    // Check if this is a promise rejection error
    if (args[0] && typeof args[0] === 'string' && args[0].includes('UnhandledRejection')) {
      console.warn('Rejeição de promessa tratada:', args[0]);
      return;
    }
    originalConsoleError.apply(console, args);
  };
};

// Initialize the app with error handling
const initApp = () => {
  try {
    // Setup global error handlers first
    setupGlobalErrorHandlers();
    
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Elemento raiz não encontrado");
    }

    const root = createRoot(container);
    
    root.render(
      <ErrorBoundary>
        <Provider store={store}>
          <PersistGate loading={<Loading />} persistor={persistor}>
            <App />
          </PersistGate>
        </Provider>
      </ErrorBoundary>
    );

    return root;
  } catch (error) {
    console.error('Falha ao inicializar o app:', error);
    // Show a fallback error message
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 2rem;">
            <h1 style="color: #ef4444; margin-bottom: 1rem;">Erro de Inicialização</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">Ocorreu um erro ao carregar a aplicação.</p>
            <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">
              Recarregar Página
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Initialize the app
initApp();
