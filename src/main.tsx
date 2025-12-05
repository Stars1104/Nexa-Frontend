import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/index.ts'
import { Elements } from '@stripe/react-stripe-js'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import { isTranslationError, cleanupTranslationArtifacts, disableTranslation } from './utils/translationUtils'


const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);


const setupGlobalErrorHandlers = () => {
  
  disableTranslation();

  
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    
    if (isTranslationError(error)) {
      console.warn('Erro relacionado à tradução detectado, limpando artefatos...', error);
      cleanupTranslationArtifacts();
      
      return;
    }
    
    console.warn('Rejeição de promessa não tratada:', event.reason);
    
    event.preventDefault();
  });

  
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    
    
    if (isTranslationError(error)) {
      console.warn('Erro de tradução detectado, limpando artefatos...', error);
      cleanupTranslationArtifacts();
      
      if (event.error && event.error.message?.includes('hydration')) {
        
        console.warn('Erro de hidratação detectado. Considere recarregar a página sem tradução.');
      }
      return;
    }
    
    console.warn('Erro global:', event.error);
    
    event.preventDefault();
  });

  
  const originalConsoleError = console.error;
  console.error = (...args) => {
    
    const errorMessage = args.join(' ');
    if (isTranslationError(errorMessage)) {
      console.warn('Erro de tradução detectado no console:', errorMessage);
      cleanupTranslationArtifacts();
      return;
    }
    
    
    if (args[0] && typeof args[0] === 'string' && args[0].includes('UnhandledRejection')) {
      console.warn('Rejeição de promessa tratada:', args[0]);
      return;
    }
    originalConsoleError.apply(console, args);
  };
};


const initApp = () => {
  try {
    
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


initApp();
