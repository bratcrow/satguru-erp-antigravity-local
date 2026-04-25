'use client';

import { useState } from 'react';
import { createUser } from '../actions/userActions';
import { Plus, Shield, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_OPTIONS = [
  { path: '/', label: 'Dashboard' },
  { path: '/pos', label: 'POS & Billing' },
  { path: '/orders', label: 'Pre-Sales Orders' },
  { path: '/customers', label: 'Customers' },
  { path: '/inventory', label: 'Inventory & Recipe' },
  { path: '/truck', label: 'Truck Management' },
  { path: '/trip-history', label: 'Trip History' },
  { path: '/settings', label: 'Settings' },
  { path: '/users', label: 'User Management' },
];

export default function UserClient({ users }: { users: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    passwordHash: '',
    pinCode: '',
    role: 'STAFF',
    allowedPages: ['/pos']
  });

  const handleCheckbox = (path: string) => {
    setFormData(prev => ({
      ...prev,
      allowedPages: prev.allowedPages.includes(path)
        ? prev.allowedPages.filter(p => p !== path)
        : [...prev.allowedPages, path]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser({
        ...formData,
        allowedPages: JSON.stringify(formData.allowedPages)
      });
      setShowModal(false);
      setFormData({ username: '', passwordHash: '', pinCode: '', role: 'STAFF', allowedPages: ['/pos'] });
      router.refresh();
    } catch (err: any) {
      alert('Failed to create user: ' + (err?.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage staff accounts and access permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New User
        </button>
      </div>

      <div className="card data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Allowed Pages</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              let pages = [];
              try { pages = JSON.parse(user.allowedPages || '[]'); } catch(e) {}
              return (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} color="var(--primary)" /> {user.username}
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' : user.role === 'MANAGER' ? 'badge-warning' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {pages.map((p: string) => (
                         <span key={p} style={{ fontSize: '0.75rem', background: 'var(--background)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                           {PAGE_OPTIONS.find(opt => opt.path === p)?.label || p}
                         </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New User</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input required type="text" className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Password</label>
                  <input required type="password" className="input-field" value={formData.passwordHash} onChange={e => setFormData({...formData, passwordHash: e.target.value})} />
                </div>
                <div className="input-group" style={{ width: '120px' }}>
                  <label className="input-label">6-Digit PIN</label>
                  <input type="text" className="input-field" value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6)})} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="SALES_PERSON">SALES_PERSON</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="STAFF">STAFF</option>
                  <option value="DRIVER">DRIVER</option>
                </select>
              </div>

              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label" style={{ marginBottom: '0.5rem' }}>Page Access Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {PAGE_OPTIONS.map(opt => (
                    <label key={opt.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--primary)', background: formData.allowedPages.includes(opt.path) ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {formData.allowedPages.includes(opt.path) && <Check size={14} color="white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        style={{ display: 'none' }}
                        checked={formData.allowedPages.includes(opt.path)}
                        onChange={() => handleCheckbox(opt.path)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
