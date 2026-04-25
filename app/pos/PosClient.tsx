'use client';
import { useState } from 'react';
import { Printer, Trash2, Search, Package, Share2, X, ShoppingCart } from 'lucide-react';
import { createPOSBill } from '@/app/actions/posActions';

export default function PosClient({ products, customers }: { products: any[], customers: any[] }) {
  const [cart, setCart] = useState<{product: any, qty: number, price: number}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customer & Checkout State
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyGst, setApplyGst] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Bill Preview State
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [savedBillData, setSavedBillData] = useState<any>(null);

  // Payment Selection Modal (for Walk-in)
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mobile product input state - inline per product
  const [productInputs, setProductInputs] = useState<Record<string, { rate: string, kg: string }>>({});

  const getProductInput = (productId: string, product: any) => {
    if (!productInputs[productId]) {
      const customer = customers.find(c => c.id === customerId);
      const price = customer?.type === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
      return { rate: String(price), kg: '' };
    }
    return productInputs[productId];
  };

  const updateProductInput = (productId: string, field: 'rate' | 'kg', value: string) => {
    setProductInputs(prev => ({
      ...prev,
      [productId]: {
        ...getProductInput(productId, products.find(p => p.id === productId)),
        [field]: value
      }
    }));
  };

  const addToCartFromInput = (product: any) => {
    const input = getProductInput(product.id, product);
    const qty = parseFloat(input.kg);
    const price = parseFloat(input.rate);
    if (!qty || qty <= 0 || !price || price <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + qty, price } : item);
      }
      return [...prev, { product, qty, price }];
    });

    setProductInputs(prev => ({
      ...prev,
      [product.id]: { rate: input.rate, kg: '' }
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxAmount = applyGst ? ((subtotal - discount) * 0.05) : 0;
  const total = subtotal - discount + taxAmount;

  const selectedCustomerObj = customers.find(c => c.id === customerId);

  const handlePreOrder = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    if (!customerId) return alert('Select a customer for pre-order!');

    try {
      await createPOSBill({
        customerId,
        total,
        discount,
        tax: taxAmount,
        paymentMethod: 'PENDING',
        items: cart.map(i => ({ productId: i.product.id, quantity: i.qty, price: i.price }))
      });
      setSavedBillData({
        customer: selectedCustomerObj,
        items: [...cart],
        subtotal, discount, taxAmount, total,
        paymentMethod: 'PENDING',
        date: new Date()
      });
      setShowBillPreview(true);
      setCart([]);
      setProductInputs({});
    } catch (e) {
      alert('Failed to save bill');
    }
  };

  const handleWalkIn = () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setShowPaymentModal(true);
  };

  const confirmWalkIn = async (method: string) => {
    setShowPaymentModal(false);
    try {
      await createPOSBill({
        customerId: customerId || undefined,
        total,
        discount,
        tax: taxAmount,
        paymentMethod: method,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.qty, price: i.price }))
      });
      setSavedBillData({
        customer: selectedCustomerObj || { name: 'Walk-in' },
        items: [...cart],
        subtotal, discount, taxAmount, total,
        paymentMethod: method,
        date: new Date()
      });
      setShowBillPreview(true);
      setCart([]);
      setProductInputs({});
    } catch (e) {
      alert('Failed to save bill');
    }
  };

  const handleShare = async () => {
    if (!savedBillData) return;
    const text = `Hari Har Namkeen - Bill\nCustomer: ${savedBillData.customer?.name || 'Walk-in'}\nTotal: ₹${savedBillData.total.toFixed(2)}\nPayment: ${savedBillData.paymentMethod}\nDate: ${savedBillData.date.toLocaleDateString()}`;
    if (navigator.share) {
      await navigator.share({ title: 'Bill', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Bill copied to clipboard!');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

  // Get cart qty for a product
  const getCartQty = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.qty : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* ========== MOBILE VIEW ========== */}
      <div className="mobile-only" style={{ flexDirection: 'column', height: '100%' }}>
        
        {/* Customer Selector */}
        <div style={{ padding: '0 0 0.75rem 0' }}>
          <input 
            type="text" 
            list="mobileCustomersList"
            className="input-field" 
            placeholder="Select customer (optional for walk-in)" 
            style={{ width: '100%' }}
            value={customerId ? (customers.find(c => c.id === customerId)?.name || '') : ''} 
            onChange={e => {
              const c = customers.find(c => c.name === e.target.value);
              setCustomerId(c ? c.id : '');
            }} 
          />
          <datalist id="mobileCustomersList">
            {customers.map(c => <option key={c.id} value={c.name}>{c.route} - {c.type}</option>)}
          </datalist>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" placeholder="Search products..." 
            style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '16px' }} 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Product List — Mobile Cards */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '160px' }}>
          {filteredProducts.map(p => {
            const input = getProductInput(p.id, p);
            const cartQty = getCartQty(p.id);
            const lineTotal = parseFloat(input.rate || '0') * parseFloat(input.kg || '0');
            return (
              <div key={p.id} className="mobile-card" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span>
                    {cartQty > 0 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                        ({cartQty}kg in cart)
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: p.stock < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {p.stock}kg
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate ₹</label>
                    <input 
                      type="number" step="0.5" 
                      className="input-field"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '16px' }}
                      value={input.rate}
                      onChange={e => updateProductInput(p.id, 'rate', e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kg</label>
                    <input 
                      type="number" step="0.1" placeholder="0"
                      className="input-field"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '16px' }}
                      value={input.kg}
                      onChange={e => updateProductInput(p.id, 'kg', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addToCartFromInput(p); }}
                    />
                  </div>
                  {lineTotal > 0 && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', minWidth: '50px', textAlign: 'right' }}>
                      ₹{lineTotal.toFixed(0)}
                    </div>
                  )}
                  <button 
                    onClick={() => addToCartFromInput(p)}
                    disabled={!input.kg || parseFloat(input.kg) <= 0}
                    style={{ 
                      background: 'var(--primary)', color: 'white', border: 'none', 
                      borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', cursor: 'pointer',
                      opacity: (!input.kg || parseFloat(input.kg) <= 0) ? 0.4 : 1,
                      fontSize: '0.8rem', fontWeight: 600
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>



        {/* Floating Bottom Button */}
        <div className="floating-bottom-bar" style={{ zIndex: 35 }}>
          <button 
            className="btn btn-primary" 
            onClick={handleWalkIn}
            disabled={cart.length === 0}
            style={{ opacity: cart.length === 0 ? 0.5 : 1, width: '100%' }}
          >
            Order Complete ₹{total.toFixed(0)}
          </button>
        </div>
      </div>

      {/* ========== DESKTOP VIEW ========== */}
      <div className="desktop-only" style={{ gap: '1.5rem', height: '100%' }}>
        {/* Left: Products with inline Rate/Kg */}
        <div className="no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Point of Sale</h2>
            <div className="input-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <Search size={18} color="var(--text-muted)" />
              <input type="text" placeholder="Search products..." style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </header>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredProducts.map(p => {
              const input = getProductInput(p.id, p);
              const cartQty = getCartQty(p.id);
              const lineTotal = parseFloat(input.rate || '0') * parseFloat(input.kg || '0');
              return (
                <div key={p.id} className="card" style={{ padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: '0.8rem', color: p.stock < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>{p.stock}kg</span>
                    </div>
                    {cartQty > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>In cart: {cartQty}kg</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: '90px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate ₹</label>
                      <input type="number" step="0.5" className="input-field" style={{ padding: '0.35rem', fontSize: '0.9rem' }} value={input.rate} onChange={e => updateProductInput(p.id, 'rate', e.target.value)} />
                    </div>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kg</label>
                      <input type="number" step="0.1" placeholder="0" className="input-field" style={{ padding: '0.35rem', fontSize: '0.9rem' }} value={input.kg} onChange={e => updateProductInput(p.id, 'kg', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addToCartFromInput(p); }} />
                    </div>
                    {lineTotal > 0 && <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', minWidth: '50px', textAlign: 'right' }}>₹{lineTotal.toFixed(0)}</div>}
                    <button onClick={() => addToCartFromInput(p)} disabled={!input.kg || parseFloat(input.kg) <= 0}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.7rem', cursor: 'pointer', opacity: (!input.kg || parseFloat(input.kg) <= 0) ? 0.4 : 1, fontWeight: 600 }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Billing */}
        <div className="glass-panel print-bill-area" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="no-print" style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <label className="input-label">Customer</label>
            <input type="text" list="desktopCustomersList" className="input-field" placeholder="Walk-in or search..."
              value={customerId ? (customers.find(c => c.id === customerId)?.name || '') : ''} 
              onChange={e => { const c = customers.find(c => c.name === e.target.value); setCustomerId(c ? c.id : ''); }} />
            <datalist id="desktopCustomersList">
              {customers.map(c => <option key={c.id} value={c.name}>{c.route} - {c.type}</option>)}
            </datalist>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No items in cart</div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.qty}kg × ₹{item.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{(item.qty * item.price).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={handleWalkIn} disabled={cart.length === 0}>
              Order Complete ₹{total.toFixed(0)}
            </button>
          </div>
        </div>
      </div>

      {/* ========== PAYMENT METHOD MODAL ========== */}
      {showPaymentModal && (
        <div className="bill-preview-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="bill-preview-content" onClick={e => e.stopPropagation()} style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Select Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['CASH', 'UPI', 'PENDING'].map(method => (
                <button key={method} className="btn btn-secondary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 600 }}
                  onClick={() => confirmWalkIn(method)}
                >
                  {method === 'PENDING' ? 'Add to Balance' : method}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowPaymentModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ========== BILL PREVIEW ========== */}
      {showBillPreview && savedBillData && (
        <div className="bill-preview-overlay" onClick={() => setShowBillPreview(false)}>
          <div className="bill-preview-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '2px dashed var(--border)' }}>
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>Hari Har Namkeen</h2>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tax Invoice</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{savedBillData.date.toLocaleDateString()} {savedBillData.date.toLocaleTimeString()}</p>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <strong>Customer:</strong> {savedBillData.customer?.name || 'Walk-in'}
            </div>
            <div style={{ padding: '0.5rem 1.5rem' }}>
              {savedBillData.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.qty}kg × ₹{item.price}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(item.qty * item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              {savedBillData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Discount</span><span>-₹{savedBillData.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>
                <span>Total</span><span>₹{savedBillData.total.toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Payment: {savedBillData.paymentMethod}
              </div>
            </div>
            <div className="bill-preview-actions">
              <button className="btn btn-secondary" onClick={() => setShowBillPreview(false)}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print
              </button>
              <button className="btn btn-primary" onClick={handleShare}>
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
