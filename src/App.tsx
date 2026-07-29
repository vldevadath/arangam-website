// src/App.tsx
import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import TopBar from './components/layout/TopBar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/layout/LoadingScreen';
import Home from './pages/Home';
import Events from './pages/Events';
import Standings from './pages/Standings';
import Results from './pages/Results';
import Champions from './pages/Champions';
import DeskLogin from './pages/DeskLogin';
import Desk from './pages/Desk';
import NotFound from './pages/NotFound';

const SEEN_KEY = 'ankam:ceremony-seen';

export default function App() {
  const { pathname } = useLocation();
  const [intro, setIntro] = useState(
    () => pathname === '/' && !sessionStorage.getItem(SEEN_KEY),
  );

  const dismissIntro = useCallback(() => {
    sessionStorage.setItem(SEEN_KEY, '1');
    setIntro(false);
  }, []);

  // Router keeps scroll position between pages; a fresh page should start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (intro) return <LoadingScreen onComplete={dismissIntro} />;

  const onDesk = pathname.startsWith('/desk');

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/results" element={<Results />} />
          <Route path="/champions" element={<Champions />} />
          <Route path="/desk" element={<DeskLogin />} />
          <Route path="/desk/board" element={<Desk />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!onDesk && <Footer />}
    </div>
  );
}
