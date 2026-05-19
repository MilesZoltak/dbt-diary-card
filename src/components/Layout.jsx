import React, { useEffect, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogOut } from 'lucide-react';
import BottomNav from './BottomNav';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function Layout() {
  const { user, logout } = useAuth();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const handleTimeout = () => {
      console.log('HIPAA Idle Timeout Reached. Forcing logout.');
      // Dispatch rescue event so JournalPage can auto-save drafts
      window.dispatchEvent(new Event('hipaa-timeout-rescue'));
      
      // Give the app a moment to fire off the Firebase save request before destroying session
      setTimeout(() => {
        logout();
      }, 500);
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleTimeout, IDLE_TIMEOUT_MS);
    };

    resetTimer(); // Initialize

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  return (
    <div className="app-container">
      <header>
        <Link to="/" className="header-logo">
          <Heart size={28} color="var(--accent-primary)" />
          <h1 style={{ margin: 0 }}>DBT Diary Card</h1>
        </Link>
        
        <BottomNav />
        
        {user && (
          <div className="header-actions">
            <div id="header-actions-portal"></div>
            {user.photoURL && <img src={user.photoURL} alt={user.displayName} className="user-avatar" />}
            <button 
              onClick={logout} 
              className="secondary" 
              style={{ width: 'auto', padding: '0.6rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
