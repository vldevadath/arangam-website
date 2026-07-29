import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { MeetBackend } from './components/MeetBackend';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MeetBackend>
        <App />
      </MeetBackend>
    </BrowserRouter>
  </StrictMode>,
);
