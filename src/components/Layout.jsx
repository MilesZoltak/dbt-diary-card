import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogOut } from 'lucide-react';
import BottomNav from './BottomNav';

function Layout() {
  const { user, logout } = useAuth();

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
