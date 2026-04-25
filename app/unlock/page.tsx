'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KeyRound, User } from 'lucide-react';
import Link from 'next/link';

export default function UnlockPage() {
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUsername = localStorage.getItem('lastUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      pinCode: pin,
      isPinLogin: 'true'
    });

    if (res?.error) {
      setError('Invalid PIN code');
      setLoading(false);
      setPin('');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  if (!username) return null; // Wait for useEffect

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', marginBottom: '1rem' }}>
          <User size={32} />
        </div>
        
        <h2>Welcome Back</h2>
        <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          {username}
        </p>

        {error && (
          <div style={{ background: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ width: '100%' }}>
            <label className="input-label" style={{ textAlign: 'left' }}>Enter 6-Digit PIN</label>
            <input 
              type="password" 
              className="input-field" 
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem' }}
              required 
              autoFocus
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }} disabled={loading}>
            <KeyRound size={18} /> {loading ? 'Unlocking...' : 'Unlock POS'}
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
            Not {username}? Sign in with password
          </Link>
        </div>
      </div>
    </div>
  );
}
