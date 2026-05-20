import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '400px', padding: '3rem' }}>
        <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Heart size={32} color="var(--danger)" />
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          It looks like the link you followed might be broken or out of date. 
        </p>
        <Link to="/" className="button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <Home size={20} /> Return Home
        </Link>
      </div>
    </div>
  );
}
