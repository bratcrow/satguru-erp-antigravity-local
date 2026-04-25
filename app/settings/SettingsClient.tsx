'use client';
import { useState } from 'react';
import { Trash2, Users, FileText, Plus, Search, X, Calendar } from 'lucide-react';
import { addEmployee, deleteEmployee } from '@/app/actions/employeeActions';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ employees, transactionsData }: { employees: any[], transactionsData: any }) {
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'LEDGER'>('EMPLOYEES');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ledger Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addEmployee(formData);
      setIsAdding(false);
      router.refresh();
    } catch (err) {
      alert('Failed to add employee.');
    }
    setLoading(false);
  };

  // Compile Transactions
  const allTransactions = [
    ...transactionsData.bills.map((b: any) => ({
      id: b.id, date: new Date(b.date), type: 'POS Bill',
      customerName: b.customer?.name || 'Walk-in', amount: b.total,
      paymentMethod: b.paymentMethod, color: 'var(--primary)'
    })),
    ...transactionsData.orders.map((o: any) => ({
      id: o.id, date: new Date(o.createdAt), type: 'Pre-Sales',
      customerName: o.customer.name, amount: o.total,
      paymentMethod: o.paymentMethod, color: 'var(--warning)'
    })),
    ...transactionsData.payments.map((p: any) => ({
      id: p.id, date: new Date(p.createdAt), type: 'Credit Settle',
      customerName: p.customer.name, amount: p.amount,
      paymentMethod: 'RECEIPT', color: 'var(--success)'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredTransactions = allTransactions.filter(tx => {
    const matchDate = filterDate ? tx.date.toISOString().split('T')[0] === filterDate : true;
    const matchCustomer = filterCustomer ? tx.customerName.toLowerCase().includes(filterCustomer.toLowerCase()) : true;
    return matchDate && matchCustomer;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        <button className={`btn ${activeTab === 'EMPLOYEES' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, padding: '0.6rem' }} onClick={() => setActiveTab('EMPLOYEES')}>
          <Users size={16} /> Employees
        </button>
        <button className={`btn ${activeTab === 'LEDGER' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, padding: '0.6rem' }} onClick={() => setActiveTab('LEDGER')}>
          <FileText size={16} /> Transactions
        </button>
      </div>

      {/* ===== EMPLOYEES TAB ===== */}
      {activeTab === 'EMPLOYEES' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Desktop add button */}
          <div className="desktop-only" style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
              <Plus size={18} /> Add Employee
            </button>
          </div>

          {/* Add Employee Modal */}
          {isAdding && (
            <div className="bill-preview-overlay">
              <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '450px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>New Employee</h3>
                  <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Name</label>
                    <input type="text" name="name" required className="input-field" placeholder="e.g. Rahul" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Role</label>
                    <select name="role" required className="input-field">
                      <option value="SALES">Sales Rep</option>
                      <option value="WAREHOUSE">Warehouse Manager</option>
                      <option value="DRIVER">Driver</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Phone</label>
                    <input type="text" name="phone" required className="input-field" placeholder="Phone Number" />
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    {loading ? 'Saving...' : 'Save Employee'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Mobile Employee Cards */}
          <div className="mobile-only" style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
            {employees.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No employees found.</p>
            ) : (
              employees.map(e => (
                <div key={e.id} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginRight: '0.4rem' }}>{e.role}</span>
                        {e.phone}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Joined: {e.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={async () => { if (confirm('Delete?')) { await deleteEmployee(e.id); router.refresh(); } }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile FAB */}
          <button className="fab mobile-only" onClick={() => setIsAdding(true)}>
            <Plus size={24} />
          </button>

          {/* Desktop Employee Table */}
          <div className="glass-panel desktop-only" style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr><th>Name</th><th>Role</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No employees.</td></tr>
                ) : (
                  employees.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.name}</td>
                      <td><span className="badge badge-warning">{e.role}</span></td>
                      <td>{e.phone}</td>
                      <td>{e.createdAt.toLocaleDateString()}</td>
                      <td>
                        <button onClick={async () => { if (confirm('Delete?')) { await deleteEmployee(e.id); router.refresh(); } }}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== LEDGER TAB ===== */}
      {activeTab === 'LEDGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '0.75rem' }}>
          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.4rem', fontSize: '16px' }} />
              {filterDate && <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', marginLeft: '0.3rem' }}>×</button>}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search customer..." value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.4rem', width: '100%', fontSize: '16px' }} />
            </div>
          </div>

          {/* Mobile Transaction Cards */}
          <div className="mobile-only" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {filteredTransactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No transactions found.</p>
            ) : (
              filteredTransactions.map(tx => (
                <div key={tx.id} className="mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: tx.color, fontSize: '0.85rem' }}>{tx.type}</div>
                      <div style={{ fontWeight: 500, marginTop: '0.15rem' }}>{tx.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{tx.amount.toFixed(2)}</div>
                      <span className={`badge ${tx.paymentMethod === 'PENDING' ? 'badge-danger' : 'badge-secondary'}`} style={{ fontSize: '0.7rem' }}>
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Transaction Table */}
          <div className="glass-panel desktop-only" style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr><th>Date & Time</th><th>Type</th><th>Customer</th><th>Payment</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions.</td></tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.9rem' }}>{tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}</td>
                      <td style={{ color: tx.color, fontWeight: 600 }}>{tx.type}</td>
                      <td style={{ fontWeight: 500 }}>{tx.customerName}</td>
                      <td><span className={`badge ${tx.paymentMethod === 'PENDING' ? 'badge-danger' : 'badge-secondary'}`}>{tx.paymentMethod}</span></td>
                      <td style={{ fontWeight: 600 }}>₹{tx.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
