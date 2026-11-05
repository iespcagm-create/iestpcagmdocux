import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './shared/styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('No se encontró el elemento raíz de DOCUX.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
