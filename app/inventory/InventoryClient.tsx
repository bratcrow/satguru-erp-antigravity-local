'use client';
import { useState } from 'react';
import { Download, Plus, Trash2, Edit, Save, X, PlusCircle, Package } from 'lucide-react';
import { addProduct, deleteProduct, updateProduct, addStock } from '@/app/actions/productActions';
import { useRouter } from 'next/navigation';

export default function InventoryClient({ initialProducts }: { initialProducts: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Edit & Add Stock State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockAddition, setStockAddition] = useState<{ [key: string]: string }>({});
  const [addingStockId, setAddingStockId] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (!initialProducts.length) return;
    const headers = ['SKU', 'Name', 'Stock (kg)', 'Retail Price', 'Wholesale Price'];
    const csvContent = [
      headers.join(','),
      ...initialProducts.map(p => [p.sku, `"${p.name}"`, p.stock, p.retailPrice, p.wholesalePrice].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addProduct(formData);
      setIsAdding(false);
      router.refresh();
    } catch (err) {
      alert('Failed to add product.');
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateProduct(editingProduct.id, {
        name: formData.get('name') as string,
        sku: formData.get('sku') as string,
        stock: parseFloat(formData.get('stock') as string) || 0,
        retailPrice: parseFloat(formData.get('retailPrice') as string) || 0,
        wholesalePrice: parseFloat(formData.get('wholesalePrice') as string) || 0,
      });
      setEditingProduct(null);
      router.refresh();
    } catch (err) {
      alert('Failed to update product.');
    }
    setLoading(false);
  };

  const handleAddStockSubmit = async (id: string) => {
    const amount = parseFloat(stockAddition[id]);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await addStock(id, amount);
      setStockAddition(prev => ({ ...prev, [id]: '' }));
      setAddingStockId(null);
      router.refresh();
    } catch (err) {
      alert('Failed to add stock.');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Desktop buttons */}
      <div className="desktop-only" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={18} /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* ADD MODAL - Full screen on mobile */}
      {isAdding && (
        <div className="bill-preview-overlay">
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>New Product</h3>
              <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Product Name</label>
                <input type="text" name="name" required className="input-field" placeholder="e.g. Mix Farsan" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">SKU</label>
                <input type="text" name="sku" required className="input-field" placeholder="e.g. MF-01" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Initial Stock (kg)</label>
                <input type="number" step="0.1" name="stock" className="input-field" defaultValue="0" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Retail ₹</label>
                  <input type="number" step="0.5" name="retailPrice" required className="input-field" />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Wholesale ₹</label>
                  <input type="number" step="0.5" name="wholesalePrice" required className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="bill-preview-overlay">
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Edit: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Product Name</label>
                <input type="text" name="name" required className="input-field" defaultValue={editingProduct.name} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">SKU</label>
                <input type="text" name="sku" required className="input-field" defaultValue={editingProduct.sku} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Total Stock (kg)</label>
                <input type="number" step="0.1" name="stock" className="input-field" defaultValue={editingProduct.stock} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Retail ₹</label>
                  <input type="number" step="0.5" name="retailPrice" required className="input-field" defaultValue={editingProduct.retailPrice} />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Wholesale ₹</label>
                  <input type="number" step="0.5" name="wholesalePrice" required className="input-field" defaultValue={editingProduct.wholesalePrice} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Save size={18} /> {loading ? 'Updating...' : 'Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal (mobile) */}
      {addingStockId && (
        <div className="bill-preview-overlay" onClick={() => setAddingStockId(null)}>
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '350px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>
              Add Stock: {initialProducts.find(p => p.id === addingStockId)?.name}
            </h3>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Quantity (kg)</label>
              <input 
                type="number" step="0.1" className="input-field" autoFocus
                value={stockAddition[addingStockId] || ''}
                onChange={e => setStockAddition(prev => ({ ...prev, [addingStockId!]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleAddStockSubmit(addingStockId!); }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setAddingStockId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleAddStockSubmit(addingStockId!)}>Add Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE GRID VIEW ===== */}
      <div className="mobile-only" style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {initialProducts.map(p => (
            <div key={p.id} className="card" style={{ padding: '0.75rem', textAlign: 'center', position: 'relative' }}>
              {/* Plus icon to add stock */}
              <button 
                onClick={() => setAddingStockId(p.id)}
                style={{ 
                  position: 'absolute', top: '0.4rem', right: '0.4rem', 
                  background: 'var(--primary)', color: 'white', border: 'none', 
                  borderRadius: '50%', width: '24px', height: '24px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >
                +
              </button>
              <div style={{ marginBottom: '0.25rem' }}>
                <Package size={20} color="var(--primary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ 
                fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem',
                color: p.stock < 10 ? 'var(--danger)' : 'var(--success)' 
              }}>
                {p.stock} kg
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                ₹{p.retailPrice} / ₹{p.wholesalePrice}
              </div>
              {/* Edit/Delete row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                <button onClick={() => { setEditingProduct(p); setIsAdding(false); }} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}><Edit size={14} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await deleteProduct(p.id); router.refresh(); } }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile FAB */}
      <button className="fab mobile-only" onClick={() => setIsAdding(true)}>
        <Plus size={24} />
      </button>

      {/* ===== DESKTOP TABLE VIEW ===== */}
      <div className="glass-panel desktop-only" style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Stock</th>
              <th>Quick Add Stock</th>
              <th>Retail Price</th>
              <th>Wholesale Price</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              initialProducts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{p.sku}</td>
                  <td>{p.name}</td>
                  <td><span className={`badge ${p.stock < 10 ? 'badge-danger' : 'badge-success'}`}>{p.stock} kg</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="number" step="0.1" placeholder="Qty (kg)" style={{ width: '80px', padding: '0.3rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                        value={stockAddition[p.id] || ''} onChange={(e) => setStockAddition(prev => ({ ...prev, [p.id]: e.target.value }))} />
                      <button onClick={() => handleAddStockSubmit(p.id)} disabled={!stockAddition[p.id]}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', cursor: 'pointer', opacity: !stockAddition[p.id] ? 0.5 : 1 }}>
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </td>
                  <td>₹{p.retailPrice}</td>
                  <td>₹{p.wholesalePrice}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setEditingProduct(p); setIsAdding(false); }} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}><Edit size={18} /></button>
                      <button onClick={async () => { if (confirm('Delete?')) { await deleteProduct(p.id); router.refresh(); } }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
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
