import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/GoogleAuthContext';
import { Heart, LogOut } from 'lucide-react';

function Layout() {
  const { user, accessToken, logout } = useAuth();

  return (
    <div className="app-container">
      <header>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Heart size={28} color="var(--accent-primary)" />
            <h1 style={{ margin: 0 }}>DBT Diary Card</h1>
          </div>
        </Link>
        
        {accessToken && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && <img src={user.picture} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
            <button onClick={logout} className="secondary" style={{ width: 'auto', padding: '0.5rem' }}>
              <LogOut size={20} />
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
