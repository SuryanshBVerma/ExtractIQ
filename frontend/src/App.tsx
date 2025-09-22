
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DocumentsPage from './pages/DocumentsPage';



// Example page components
function Home() {
  return <div className="p-8">Home Page</div>;
}


function Schemas() {
  return <div className="p-8">Schemas Page</div>;
}

function Jobs() {
  return <div className="p-8">Jobs Page</div>;
}

function Analytics() {
  return <div className="p-8">Analytics Page</div>;
}

function Settings() {
  return <div className="p-8">Settings Page</div>;
}

function NotFound() {
  return <div className="p-8">404 - Page Not Found</div>;
}

function App() {
  // Dark mode state and handler
  // Persist dark mode state in localStorage
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme-dark');
    if (stored !== null) {
      return stored === 'true';
    }
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme-dark', isDark ? 'true' : 'false');
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <Router>
      <Navbar isDark={isDark} onToggleDark={handleToggleDark} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/schemas" element={<Schemas />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
