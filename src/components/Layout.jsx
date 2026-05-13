import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogOut } from 'lucide-react';

function Layout() {
  const { user, accessToken, logout } = useAuth();

  return (
    <div className="app-container">
      <header>
        <Link to="/" className="header-logo">
          <Heart size={28} color="var(--accent-primary)" />
          <h1 style={{ margin: 0 }}>DBT Diary Card</h1>
        </Link>
        
        {user && (
          <div className="header-actions">
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
      <Outlet />
    </div>
  );
}

export default Layout;
