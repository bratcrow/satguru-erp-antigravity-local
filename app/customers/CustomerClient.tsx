'use client';
import { useState, useRef } from 'react';
import { Download, Plus, Trash2, IndianRupee, Search, Filter, Upload, X } from 'lucide-react';
import { addCustomer, deleteCustomer } from '@/app/actions/customerActions';
import { clearCustomerCredit } from '@/app/actions/transactionActions';
import { useRouter } from 'next/navigation';

export default function CustomerClient({ initialCustomers }: { initialCustomers: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPending, setFilterPending] = useState(false);

  // Settlement State
  const [settlingCustomer, setSettlingCustomer] = useState<any>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // CSV Import
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

  // Get unique routes for filter
  const allRoutes = Array.from(new Set(initialCustomers.map(c => c.route))).sort();

  // Filter logic
  const filteredCustomers = initialCustomers.filter(c => {
    const matchName = searchName ? c.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchRoute = filterRoute ? c.route === filterRoute : true;
    const matchType = filterType ? c.type === filterType : true;
    const matchPending = filterPending ? c.pendingBalance > 0 : true;
    return matchName && matchRoute && matchType && matchPending;
  });

  const handleExportCSV = () => {
    if (!initialCustomers.length) return;
    const headers = ['Name', 'Type', 'Phone', 'Route', 'Pending Balance'];
    const csvContent = [
      headers.join(','),
      ...initialCustomers.map(c => [`"${c.name}"`, c.type, `"${c.phone || ''}"`, `"${c.route}"`, c.pendingBalance].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addCustomer(formData);
      setIsAdding(false);
      router.refresh();
    } catch (err) {
      alert('Failed to add customer.');
    }
    setLoading(false);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCustomer || !settleAmount) return;
    const amount = parseFloat(settleAmount);
    if (amount <= 0 || amount > settlingCustomer.pendingBalance) return alert("Invalid amount.");
    setLoading(true);
    try {
      await clearCustomerCredit(settlingCustomer.id, amount, settleNotes);
      setSettlingCustomer(null);
      setSettleAmount('');
      setSettleNotes('');
      router.refresh();
    } catch (e) {
      alert("Failed to settle credit.");
    }
    setLoading(false);
  };

  // CSV Import handlers
  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return alert('CSV file is empty or has no data rows');
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((h, i) => {
          if (h.includes('name')) row.name = values[i];
          else if (h.includes('type')) row.type = values[i]?.toUpperCase() || 'RETAIL';
          else if (h.includes('phone') || h.includes('mobile')) row.phone = values[i];
          else if (h.includes('route') || h.includes('location') || h.includes('area')) row.route = values[i];
          else if (h.includes('address')) row.address = values[i];
        });
        return row;
      }).filter(r => r.name && r.route);
      
      setCsvData(rows);
      setShowCsvImport(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    let success = 0, failed = 0;
    for (const row of csvData) {
      try {
        const fd = new FormData();
        fd.set('name', row.name);
        fd.set('type', row.type || 'RETAIL');
        fd.set('route', row.route);
        fd.set('phone', row.phone || '');
        fd.set('address', row.address || '');
        await addCustomer(fd);
        success++;
      } catch {
        failed++;
      }
    }
    setCsvImporting(false);
    setShowCsvImport(false);
    setCsvData([]);
    router.refresh();
    alert(`Import complete! ${success} added, ${failed} failed.`);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Hidden file input */}
      <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }} onChange={handleCsvFileSelect} />

      {/* Desktop buttons */}
      <div className="desktop-only" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}><Download size={18} /> Export CSV</button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={18} /> Import CSV</button>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}><Plus size={18} /> Add Customer</button>
      </div>

      {/* ===== FILTERS ===== */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search name..." value={searchName} onChange={e => setSearchName(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.4rem', width: '100%', fontSize: '16px' }} />
        </div>
        <select className="input-field" value={filterRoute} onChange={e => setFilterRoute(e.target.value)} style={{ width: 'auto', minWidth: '100px', padding: '0.4rem' }}>
          <option value="">All Routes</option>
          {allRoutes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', padding: '0.4rem' }}>
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={filterPending} onChange={e => setFilterPending(e.target.checked)} />
          Pending Only
        </label>
        {/* Mobile import button */}
        <button className="btn btn-secondary mobile-only" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> CSV
        </button>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAdding && (
        <div className="bill-preview-overlay">
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>New Customer</h3>
              <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Customer Name</label>
                <input type="text" name="name" required className="input-field" placeholder="e.g. Ramesh Stores" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Type</label>
                  <select name="type" required className="input-field">
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Route / Village</label>
                  <input type="text" name="route" required className="input-field" placeholder="e.g. Waluj" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Phone</label>
                <input type="text" name="phone" className="input-field" placeholder="Optional" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Address</label>
                <input type="text" name="address" className="input-field" placeholder="Optional" />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Saving...' : 'Save Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE CREDIT MODAL */}
      {settlingCustomer && (
        <div className="bill-preview-overlay" onClick={() => setSettlingCustomer(null)}>
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
              <IndianRupee size={18} style={{ verticalAlign: 'middle' }} /> Settle: {settlingCustomer.name}
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>Pending: <strong style={{ color: 'var(--danger)' }}>₹{settlingCustomer.pendingBalance}</strong></p>
            <form onSubmit={handleSettleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Amount</label>
                <input type="number" step="0.1" required className="input-field" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} max={settlingCustomer.pendingBalance} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Notes</label>
                <input type="text" className="input-field" value={settleNotes} onChange={e => setSettleNotes(e.target.value)} placeholder="e.g. Paid in Cash" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSettlingCustomer(null)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? 'Processing...' : 'Settle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV PREVIEW MODAL */}
      {showCsvImport && (
        <div className="bill-preview-overlay" onClick={() => setShowCsvImport(false)}>
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Import {csvData.length} Customers</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
              {csvData.slice(0, 10).map((row, i) => (
                <div key={i} className="mobile-card" style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.route} • {row.type} {row.phone ? `• ${row.phone}` : ''}</div>
                </div>
              ))}
              {csvData.length > 10 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>...and {csvData.length - 10} more</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCsvImport(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCsvImport} disabled={csvImporting}>
                {csvImporting ? 'Importing...' : `Import ${csvData.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE LIST VIEW ===== */}
      <div className="mobile-only" style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {filteredCustomers.length} customers
        </div>
        {filteredCustomers.map(c => (
          <div key={c.id} className="mobile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span className={`badge ${c.type === 'WHOLESALE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem', marginRight: '0.4rem' }}>
                    {c.type}
                  </span>
                  {c.route} {c.phone ? `• ${c.phone}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: c.pendingBalance > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1rem' }}>
                  ₹{c.pendingBalance}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', justifyContent: 'flex-end' }}>
                  {c.pendingBalance > 0 && (
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setSettlingCustomer(c)}>Settle</button>
                  )}
                  <button onClick={async () => { if (confirm('Delete?')) { await deleteCustomer(c.id); router.refresh(); } }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile FAB */}
      <button className="fab mobile-only" onClick={() => setIsAdding(true)}>
        <Plus size={24} />
      </button>

      {/* ===== DESKTOP TABLE VIEW ===== */}
      <div className="glass-panel desktop-only no-print" style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>Name</th>
              <th>Type / Route</th>
              <th>Phone</th>
              <th>Pending Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers found.</td></tr>
            ) : (
              filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <span className={`badge ${c.type === 'WHOLESALE' ? 'badge-warning' : 'badge-success'}`} style={{ marginRight: '0.5rem' }}>{c.type}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{c.route}</span>
                  </td>
                  <td>{c.phone || '-'}</td>
                  <td style={{ fontWeight: 600, color: c.pendingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{c.pendingBalance}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {c.pendingBalance > 0 && (
                        <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setSettlingCustomer(c)}>Settle Credit</button>
                      )}
                      <button onClick={async () => { if (confirm('Delete?')) { await deleteCustomer(c.id); router.refresh(); } }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.4rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
