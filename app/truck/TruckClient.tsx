'use client';
import { useState, useEffect } from 'react';
import { Truck, Calendar, ArrowRight, ArrowLeft, CheckCircle, Download, PackagePlus, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTruckTrips, planTruckTrip, dispatchTruck, returnTruck, addManualInventory } from '@/app/actions/truckActions';

export default function TruckClient({ products, availableRoutes, employees, ordersCountByDate }: { products: any[], availableRoutes: string[], employees: any[], ordersCountByDate: Record<string, number> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  
  // Plan Trip State
  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');

  // Manual Inventory State
  const [manualProd, setManualProd] = useState('');
  const [manualQty, setManualQty] = useState('');

  // Return State
  const [returnForm, setReturnForm] = useState<Record<string, { returned: number, wastage: number, damage: number }>>({});

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [employee1Name, setEmployee1Name] = useState('');
  const [employee2Name, setEmployee2Name] = useState('');

  // Trip detail view (mobile)
  const [showTripDetail, setShowTripDetail] = useState(false);

  const loadTrips = async (date: string) => {
    const data = await getTruckTrips(date);
    setTrips(data);
    if (activeTrip) {
      const updated = data.find((t: any) => t.id === activeTrip.id);
      setActiveTrip(updated || null);
    }
  };

  useEffect(() => {
    loadTrips(selectedDate);
  }, [selectedDate]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const renderCalendarTiles = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const tiles = [];
    
    // Empty tiles for first day offset
    for (let i = 0; i < firstDay; i++) {
      tiles.push(<div key={`empty-${i}`} style={{ minHeight: '60px' }}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const orderCount = ordersCountByDate[dateStr] || 0;
      
      tiles.push(
        <div 
          key={day}
          onClick={() => { setSelectedDate(dateStr); setActiveTrip(null); }}
          style={{
            minHeight: '60px',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
            background: isSelected ? 'rgba(249, 115, 22, 0.08)' : isToday ? 'rgba(249, 115, 22, 0.03)' : 'var(--surface)',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
            {day}
          </div>
          {orderCount > 0 && (
            <div style={{ 
              fontSize: '0.6rem', fontWeight: 600, 
              background: 'var(--success)', color: 'white',
              padding: '0.1rem 0.3rem', borderRadius: '4px', marginTop: '0.2rem'
            }}>
              {orderCount} orders
            </div>
          )}
        </div>
      );
    }
    return tiles;
  };

  const handlePlanTrip = async () => {
    if (!selectedRoute) return;
    try {
      await planTruckTrip({ routeDate: selectedDate, route: selectedRoute });
      setIsPlanning(false);
      setSelectedRoute('');
      loadTrips(selectedDate);
    } catch(e) { alert('Failed to plan trip'); }
  };

  const handleAddManual = async () => {
    if (!manualProd || !manualQty || !activeTrip) return;
    try {
      await addManualInventory(activeTrip.id, manualProd, parseFloat(manualQty));
      setManualProd(''); setManualQty('');
      loadTrips(selectedDate);
    } catch (e) { alert('Failed to add inventory'); }
  };

  const openDispatchModal = () => {
    if (!activeTrip) return;
    setShowDispatchModal(true);
    setDriverName(''); setEmployee1Name(''); setEmployee2Name('');
  };

  const handleConfirmDispatch = async () => {
    if (!activeTrip || !driverName) return alert('Driver is required!');
    try {
      await dispatchTruck(activeTrip.id, { driverName, employee1Name, employee2Name });
      setShowDispatchModal(false);
      loadTrips(selectedDate);
    } catch(e) { alert('Failed to dispatch truck'); }
  };

  const handleReturnUpdate = (invId: string, field: 'returned' | 'wastage' | 'damage', val: string) => {
    setReturnForm(prev => ({ ...prev, [invId]: { ...prev[invId], [field]: parseFloat(val) || 0 } }));
  };

  const handleSettleReturn = async () => {
    if (!activeTrip) return;
    const payload = activeTrip.inventory.map((inv: any) => ({
      invId: inv.id,
      returned: returnForm[inv.id]?.returned || 0,
      wastage: returnForm[inv.id]?.wastage || 0,
      damage: returnForm[inv.id]?.damage || 0,
    }));
    await returnTruck(activeTrip.id, payload);
    loadTrips(selectedDate);
  };

  const handleExportCSV = (trip: any) => {
    const headers = ['Product', 'Loaded', 'Returned', 'Sold', 'Wastage', 'Damage'];
    const rows = trip.inventory.map((i: any) => [`"${i.product.name}"`, i.loadedQty, i.returnedQty, i.soldQty, i.wastage, i.damage].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `truck_${trip.route}_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* ===== CALENDAR HEADER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* ===== CALENDAR GRID ===== */}
      <div style={{ marginBottom: '1rem' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.25rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.25rem' }}>{d}</div>
          ))}
        </div>
        {/* Day tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
          {renderCalendarTiles()}
        </div>
      </div>

      {/* ===== SELECTED DATE TRIPS ===== */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Trips: {selectedDate}</h3>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setIsPlanning(!isPlanning)}>
            + Plan Trip
          </button>
        </div>

        {/* Plan Trip */}
        {isPlanning && (
          <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="input-label">Route</label>
                <select className="input-field" value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)}>
                  <option value="">-- Choose --</option>
                  {availableRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handlePlanTrip} style={{ padding: '0.5rem 1rem' }}>Generate</button>
            </div>
          </div>
        )}

        {/* Trip List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          {trips.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No trips planned for this date.</p>
          ) : (
            trips.map(t => (
              <div key={t.id} className="mobile-card" style={{ cursor: 'pointer', borderColor: activeTrip?.id === t.id ? 'var(--primary)' : 'var(--border)' }}
                onClick={() => { setActiveTrip(t); setShowTripDetail(true); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.route}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {t.inventory.length} items • {t.status !== 'PLANNED' ? `Driver: ${t.driverName}` : 'Not dispatched'}
                    </div>
                    {t.employee1Name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team: {t.employee1Name}{t.employee2Name ? `, ${t.employee2Name}` : ''}</div>}
                  </div>
                  <span className={`badge ${t.status === 'OUT' ? 'badge-warning' : t.status === 'RETURNED' ? 'badge-success' : 'badge-secondary'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== TRIP DETAIL MODAL (mobile-friendly) ===== */}
      {showTripDetail && activeTrip && (
        <div className="bill-preview-overlay" onClick={() => setShowTripDetail(false)}>
          <div style={{ background: 'var(--background)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={18} /> {activeTrip.route}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Status: {activeTrip.status}
                  {activeTrip.driverName && ` • Driver: ${activeTrip.driverName}`}
                </div>
              </div>
              <button onClick={() => setShowTripDetail(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} onClick={() => handleExportCSV(activeTrip)}>
                <Download size={14} /> CSV
              </button>
              {activeTrip.status === 'PLANNED' && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} onClick={openDispatchModal}>
                  Dispatch <ArrowRight size={14} />
                </button>
              )}
              {activeTrip.status === 'OUT' && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleSettleReturn}>
                  <CheckCircle size={14} /> Settle Return
                </button>
              )}
            </div>

            {/* Manual Inventory (PLANNED only) */}
            {activeTrip.status === 'PLANNED' && (
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(249, 115, 22, 0.03)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}>
                  <PackagePlus size={16} /> Add Manual Inventory
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <select className="input-field" value={manualProd} onChange={e => setManualProd(e.target.value)} style={{ padding: '0.4rem' }}>
                      <option value="">Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ width: '80px', marginBottom: 0 }}>
                    <input type="number" step="0.1" className="input-field" placeholder="Kg" value={manualQty} onChange={e => setManualQty(e.target.value)} style={{ padding: '0.4rem' }} />
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={handleAddManual}>Add</button>
                </div>
              </div>
            )}

            {/* Inventory Cards */}
            <div style={{ padding: '1rem 1.25rem' }}>
              {activeTrip.inventory.map((inv: any) => (
                <div key={inv.id} className="mobile-card" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeTrip.status === 'OUT' ? '0.5rem' : 0 }}>
                    <div style={{ fontWeight: 600 }}>{inv.product.name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.loadedQty} kg</div>
                  </div>

                  {activeTrip.status === 'OUT' && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Returned</label>
                        <input type="number" step="0.1" className="input-field" style={{ padding: '0.3rem', fontSize: '16px' }}
                          onChange={e => handleReturnUpdate(inv.id, 'returned', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Wastage</label>
                        <input type="number" step="0.1" className="input-field" style={{ padding: '0.3rem', fontSize: '16px' }}
                          onChange={e => handleReturnUpdate(inv.id, 'wastage', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Damage</label>
                        <input type="number" step="0.1" className="input-field" style={{ padding: '0.3rem', fontSize: '16px' }}
                          onChange={e => handleReturnUpdate(inv.id, 'damage', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {activeTrip.status === 'RETURNED' && (
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
                      <span>Ret: {inv.returnedQty}</span>
                      <span style={{ color: 'var(--warning)' }}>Wst: {inv.wastage}</span>
                      <span style={{ color: 'var(--danger)' }}>Dmg: {inv.damage}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>Sold: {inv.soldQty}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== DISPATCH MODAL ===== */}
      {showDispatchModal && (
        <div className="bill-preview-overlay" onClick={() => setShowDispatchModal(false)}>
          <div className="bill-preview-content" style={{ padding: '1.5rem', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>
              <Users size={18} /> Assign Personnel
            </h3>
            <div className="input-group">
              <label className="input-label">Driver (Required)</label>
              <select className="input-field" value={driverName} onChange={e => setDriverName(e.target.value)}>
                <option value="">-- Select --</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Employee 1</label>
              <select className="input-field" value={employee1Name} onChange={e => setEmployee1Name(e.target.value)}>
                <option value="">-- Optional --</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Employee 2</label>
              <select className="input-field" value={employee2Name} onChange={e => setEmployee2Name(e.target.value)}>
                <option value="">-- Optional --</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name} ({e.role})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDispatchModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmDispatch}>Dispatch</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
