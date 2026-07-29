import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { MeetBackend } from './components/MeetBackend';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BASE_URL keeps routing correct under the /<repo>/ path GitHub Pages serves. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MeetBackend>
        <App />
      </MeetBackend>
    </BrowserRouter>
  </StrictMode>,
);
