import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

// Fontes servidas pelo próprio app (sem Google Fonts): nenhum dado do usuário vai para terceiros.
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-sans-condensed/700.css';

// Bootstrap 5.3: framework da interface (grade, menu, botões, formulários, cards, modal...).
// O tema com as cores do Threshold fica em styles/bootstrap-tema.css.
import 'bootstrap/dist/css/bootstrap.min.css';

import './styles/tokens.css';
import './styles/bootstrap-tema.css';
import './index.css';
import './styles/components.css';
import './styles/salas.css';
import './styles/animacoes.css';
import './styles/atmosfera.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
