'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Users, Truck, ShoppingCart, Calculator, Settings, BarChart2, Menu, X, LogOut, Shield, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // If session loading takes too long, redirect to login
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => setLoadingTimeout(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Exclude shell on auth pages
  if (pathname === '/login' || pathname === '/unlock') {
    return <>{children}</>;
  }

  if (status === 'loading' && !loadingTimeout) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!session) {
    router.replace('/login');
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Redirecting...</div>;
  }

  const user = session.user as any;
  let allowedPages: string[] = [];
  try {
    allowedPages = JSON.parse(user.allowedPages || '[]');
  } catch(e) {}

  const hasAccess = (path: string) => allowedPages.includes(path);

  // Definitions of all links
  const navLinks = [
    { href: '/', icon: <BarChart2 size={24} />, label: 'Dashboard', mobilePos: 'bottom' },
    { href: '/pos', icon: <Calculator size={24} />, label: 'POS', mobilePos: 'bottom' },
    { href: '/orders', icon: <ShoppingCart size={24} />, label: 'Orders', mobilePos: 'bottom' },
    { href: '/customers', icon: <Users size={24} />, label: 'Customers', mobilePos: 'bottom' },
    { href: '/inventory', icon: <Package size={24} />, label: 'Inventory', mobilePos: 'bottom' },
    { href: '/truck', icon: <Truck size={24} />, label: 'Truck', mobilePos: 'menu' },
    { href: '/settings', icon: <Settings size={24} />, label: 'Settings', mobilePos: 'menu' },
    { href: '/users', icon: <Shield size={24} />, label: 'Users', mobilePos: 'menu' },
    { href: '/trip-history', icon: <ClipboardList size={24} />, label: 'Trip History', mobilePos: 'menu' },
  ];

  const visibleLinks = navLinks.filter(link => hasAccess(link.href));
  const bottomNavLinks = visibleLinks.filter(link => link.mobilePos === 'bottom').slice(0, 5); // Max 5
  const menuOnlyLinks = visibleLinks.filter(link => link.mobilePos === 'menu'); // Only menu items for hamburger

  return (
    <div className="app-container">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="sidebar no-print desktop-only">
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Hari Har</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>ERP & POS</p>
        </div>
        
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {visibleLinks.map(link => (
            <NavLink key={link.href} href={link.href} icon={link.icon} label={link.label} active={pathname === link.href} />
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '2rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '1rem', padding: '0 1rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {user.name} ({user.role})
          </div>
          <button onClick={() => signOut()} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* --- MOBILE TOP BAR --- */}
        <header className="mobile-only mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '0 1rem 0 0', display: 'flex', alignItems: 'center' }}>
              <Menu size={28} />
            </button>
            <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Hari Har</h2>
          </div>
        </header>

        <main className="main-content with-bottom-nav">
          {children}
        </main>

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="mobile-only bottom-nav">
          {bottomNavLinks.map(link => (
            <Link key={link.href} href={link.href} className={`bottom-nav-item ${pathname === link.href ? 'active' : ''}`}>
              {link.icon}
              <span style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* --- MOBILE HAMBURGER MENU OVERLAY --- */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay mobile-only">
          <div className="mobile-menu-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Menu</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.name} ({user.role})</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none' }}>
                <X size={28} />
              </button>
            </div>
            <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {menuOnlyLinks.map(link => (
                <NavLink key={link.href} href={link.href} icon={link.icon} label={link.label} active={pathname === link.href} onClick={() => setMobileMenuOpen(false)} />
              ))}
              <div style={{ marginTop: '2rem' }}>
                <button onClick={() => signOut()} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        color: active ? 'var(--primary)' : 'var(--text-main)',
        background: active ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
        textDecoration: 'none',
        borderRadius: 'var(--radius-sm)',
        transition: 'var(--transition)',
        fontWeight: active ? 600 : 500
      }}
      className="nav-link"
    >
      <span style={{ color: active ? 'var(--primary)' : 'inherit' }}>{icon}</span>
      {label}
    </Link>
  );
}
