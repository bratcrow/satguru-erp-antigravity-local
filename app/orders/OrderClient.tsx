'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Printer, Download, Package, Edit, X, Search, Share2, ArrowLeft } from 'lucide-react';
import { createOrder, getOrdersByDate, deleteOrder, updateOrder } from '@/app/actions/orderActions';

export default function OrderClient({ customers, products }: { customers: any[], products: any[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState<{productId: string, quantity: number, price: number}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [mobileOrderMode, setMobileOrderMode] = useState(false);
  const [productInputs, setProductInputs] = useState<Record<string, { rate: string, kg: string }>>({});
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [savedBillData, setSavedBillData] = useState<any>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);

  const allRoutes = Array.from(new Set(customers.map((c: any) => c.route))).sort();

  const loadOrders = async (date: string) => {
    const data = await getOrdersByDate(date);
    setOrders(data);
  };

  useEffect(() => { loadOrders(selectedDate); }, [selectedDate]);
  useEffect(() => { if (printOrder) { window.print(); setPrintOrder(null); } }, [printOrder]);

  const getProductInput = (pid: string, product: any) => {
    if (!productInputs[pid]) {
      const c = customers.find((c: any) => c.id === selectedCustomer);
      const price = c?.type === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
      return { rate: String(price), kg: '' };
    }
    return productInputs[pid];
  };

  const updateProductInput = (pid: string, field: 'rate' | 'kg', val: string) => {
    setProductInputs(prev => ({
      ...prev, [pid]: { ...getProductInput(pid, products.find((p: any) => p.id === pid)), [field]: val }
    }));
  };

  const addToCartFromInput = (product: any) => {
    const input = getProductInput(product.id, product);
    const qty = parseFloat(input.kg), price = parseFloat(input.rate);
    if (!qty || qty <= 0 || !price) return;
    setOrderItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty, price } : i);
      return [...prev, { productId: product.id, quantity: qty, price }];
    });
    setProductInputs(prev => ({ ...prev, [product.id]: { rate: input.rate, kg: '' } }));
  };

  const removeFromCart = (id: string) => setOrderItems(orderItems.filter(i => i.productId !== id));
  const cartTotal = orderItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const selectedCustomerObj = customers.find((c: any) => c.id === selectedCustomer);
  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCustomers = customers.filter((c: any) => {
    const mr = filterRoute ? c.route === filterRoute : true;
    return mr;
  });

  const handleSaveOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) return alert('Select customer and add items');
    try {
      if (editingOrderId) await updateOrder(editingOrderId, { items: orderItems });
      else await createOrder({ customerId: selectedCustomer, routeDate: selectedDate, items: orderItems });
      setSavedBillData({
        customer: selectedCustomerObj, items: orderItems.map(i => ({
          ...i, product: products.find((p: any) => p.id === i.productId)
        })), total: cartTotal, date: new Date()
      });
      setShowBillPreview(true);
      setIsAdding(false); setMobileOrderMode(false); setEditingOrderId(null);
      setSelectedCustomer(''); setOrderItems([]); setProductInputs({});
      loadOrders(selectedDate);
    } catch { alert('Failed to save order'); }
  };

  const handleEditOrder = (order: any) => {
    setIsAdding(true); setEditingOrderId(order.id); setSelectedCustomer(order.customerId);
    setOrderItems(order.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: i.price })));
  };

  const handleDeleteOrder = async (id: string) => { if (confirm('Delete?')) { await deleteOrder(id); loadOrders(selectedDate); } };

  const handleExportCSV = () => {
    if (!orders.length) return;
    const rows = ['Order ID,Customer,Route,Product,Qty,Price,Total'];
    orders.forEach((o: any) => o.items.forEach((i: any) => rows.push(`${o.id},"${o.customer.name}","${o.customer.route}","${i.product.name}",${i.quantity},${i.price},${i.quantity * i.price}`)));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `orders_${selectedDate}.csv`; link.click();
  };

  const handleShare = async () => {
    if (!savedBillData) return;
    const text = `Hari Har Namkeen\nCustomer: ${savedBillData.customer?.name}\nTotal: ₹${savedBillData.total.toFixed(2)}\nDate: ${savedBillData.date.toLocaleDateString()}`;
    if (navigator.share) await navigator.share({ title: 'Order', text });
    else { await navigator.clipboard.writeText(text); alert('Copied!'); }
  };

  const openMobileOrder = (custId: string) => {
    setSelectedCustomer(custId); setMobileOrderMode(true); setOrderItems([]); setProductInputs({});
  };

  const getCartQty = (pid: string) => orderItems.find(i => i.productId === pid)?.quantity || 0;

  // ===== MOBILE ORDER MODE (POS-like) =====
  if (mobileOrderMode && selectedCustomer) {
    return (
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button onClick={() => { setMobileOrderMode(false); setOrderItems([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
          <div><strong>{selectedCustomerObj?.name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedCustomerObj?.route} • {selectedCustomerObj?.type}</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search products..." style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '16px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
          {filteredProducts.map((p: any) => {
            const input = getProductInput(p.id, p);
            const cq = getCartQty(p.id);
            const lt = parseFloat(input.rate || '0') * parseFloat(input.kg || '0');
            return (
              <div key={p.id} className="mobile-card" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div><span style={{ fontWeight: 600 }}>{p.name}</span>{cq > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>({cq}kg)</span>}</div>
                  <span style={{ fontSize: '0.75rem', color: p.stock < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>{p.stock}kg</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate ₹</label><input type="number" step="0.5" className="input-field" style={{ width: '100%', padding: '0.4rem', fontSize: '16px' }} value={input.rate} onChange={e => updateProductInput(p.id, 'rate', e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kg</label><input type="number" step="0.1" placeholder="0" className="input-field" style={{ width: '100%', padding: '0.4rem', fontSize: '16px' }} value={input.kg} onChange={e => updateProductInput(p.id, 'kg', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addToCartFromInput(p); }} /></div>
                  {lt > 0 && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', minWidth: '45px', textAlign: 'right' }}>₹{lt.toFixed(0)}</div>}
                  <button onClick={() => addToCartFromInput(p)} disabled={!input.kg || parseFloat(input.kg) <= 0} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', cursor: 'pointer', opacity: (!input.kg || parseFloat(input.kg) <= 0) ? 0.4 : 1, fontWeight: 600 }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="floating-bottom-bar">
          <button className="btn btn-primary" onClick={handleSaveOrder} disabled={orderItems.length === 0} style={{ opacity: orderItems.length === 0 ? 0.5 : 1 }}>
            Order Complete ₹{cartTotal.toFixed(0)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ===== MOBILE CUSTOMER LIST ===== */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flex: 1 }}>
            <Calendar size={16} color="var(--primary)" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.4rem', fontWeight: 600, fontSize: '16px', width: '100%' }} />
          </div>
          <select className="input-field" value={filterRoute} onChange={e => setFilterRoute(e.target.value)} style={{ width: 'auto', padding: '0.4rem' }}>
            <option value="">All Routes</option>
            {allRoutes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          {filteredCustomers.map((c: any) => {
            const custOrders = orders.filter((o: any) => o.customerId === c.id);
            return (
              <div key={c.id} className="mobile-card" onClick={() => openMobileOrder(c.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <span className={`badge ${c.type === 'WHOLESALE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem', marginRight: '0.3rem' }}>{c.type}</span>
                      {c.route} {c.phone ? `• ${c.phone}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {custOrders.length > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{custOrders.length} order(s)</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to order</span>
                    )}
                    {c.pendingBalance > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.2rem' }}>₹{c.pendingBalance} due</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Calendar size={18} color="var(--primary)" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem', fontWeight: 600 }} />
            </div>
            <button className="btn btn-secondary" onClick={handleExportCSV}><Download size={18} /> CSV</button>
          </div>
          {!isAdding && <button className="btn btn-primary" onClick={() => { setIsAdding(true); setEditingOrderId(null); setOrderItems([]); setSelectedCustomer(''); }}><Plus size={18} /> New Order</button>}
        </div>

        {isAdding && (
          <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--surface)' }}>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>{editingOrderId ? 'Edit Order' : 'Create Order'}</h2>
                <button className="btn btn-secondary" onClick={() => setIsAdding(false)}><X size={18} /> Close</button>
              </div>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', alignContent: 'start' }}>
                    {filteredProducts.map((p: any) => (
                      <div key={p.id} className="card" style={{ cursor: 'pointer', padding: '1rem', textAlign: 'center' }} onClick={() => {
                        if (!selectedCustomer) return alert('Select customer first');
                        const c = customers.find((c: any) => c.id === selectedCustomer);
                        const price = c?.type === 'WHOLESALE' ? p.wholesalePrice : p.retailPrice;
                        const qty = prompt(`Qty for ${p.name} (kg):`);
                        if (qty && parseFloat(qty) > 0) {
                          setOrderItems(prev => {
                            const ex = prev.find(i => i.productId === p.id);
                            if (ex) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + parseFloat(qty) } : i);
                            return [...prev, { productId: p.id, quantity: parseFloat(qty), price }];
                          });
                        }
                      }}>
                        <Package size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: p.stock < 10 ? 'var(--danger)' : 'var(--success)' }}>{p.stock} kg</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width: '350px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <label className="input-label">Customer</label>
                    <input type="text" list="orderCustList" className="input-field" placeholder="Search..."
                      value={selectedCustomer ? (customers.find((c: any) => c.id === selectedCustomer)?.name || '') : ''}
                      onChange={e => { const c = customers.find((c: any) => c.name === e.target.value); setSelectedCustomer(c ? c.id : ''); }}
                      disabled={!!editingOrderId} />
                    <datalist id="orderCustList">{customers.map((c: any) => <option key={c.id} value={c.name}>{c.route}</option>)}</datalist>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {orderItems.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No items.</p> : orderItems.map((item, idx) => {
                      const p = products.find((pr: any) => pr.id === item.productId);
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                          <div><div style={{ fontWeight: 600 }}>{p?.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity}kg × ₹{item.price}</div></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{(item.quantity * item.price).toFixed(0)}</span>
                            <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}><span>Total</span><span>₹{cartTotal.toFixed(0)}</span></div>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveOrder} disabled={orderItems.length === 0 || !selectedCustomer}>{editingOrderId ? 'Update' : 'Save Order'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Customer</th><th>Route</th><th>Items</th><th>Total</th><th className="no-print">Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders for this date.</td></tr> : orders.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.customer.name}<br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.customer.type}</span></td>
                  <td><span className="badge badge-warning">{o.customer.route}</span></td>
                  <td>{o.items.map((i: any, idx: number) => <div key={idx} style={{ fontSize: '0.85rem' }}>• {i.product.name} ({i.quantity}kg)</div>)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{o.total}</td>
                  <td className="no-print">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleEditOrder(o)}><Edit size={14} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => handleDeleteOrder(o.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview */}
      {showBillPreview && savedBillData && (
        <div className="bill-preview-overlay" onClick={() => setShowBillPreview(false)}>
          <div className="bill-preview-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '2px dashed var(--border)' }}>
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>Hari Har Namkeen</h2>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pre-Sales Order</p>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}><strong>Customer:</strong> {savedBillData.customer?.name}</div>
            <div style={{ padding: '0.5rem 1.5rem' }}>
              {savedBillData.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>
                  <div><div style={{ fontWeight: 500 }}>{item.product?.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity}kg × ₹{item.price}</div></div>
                  <div style={{ fontWeight: 600 }}>₹{(item.quantity * item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}><span>Total</span><span>₹{savedBillData.total.toFixed(2)}</span></div>
            </div>
            <div className="bill-preview-actions">
              <button className="btn btn-secondary" onClick={() => setShowBillPreview(false)}><X size={16} /> Close</button>
              <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
              <button className="btn btn-primary" onClick={handleShare}><Share2 size={16} /> Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
