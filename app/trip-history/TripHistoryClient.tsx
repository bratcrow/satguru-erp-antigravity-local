'use client';
import { useState } from 'react';
import { Truck, Calendar, Search, ChevronDown, ChevronUp, Download } from 'lucide-react';

export default function TripHistoryClient({ trips }: { trips: any[] }) {
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  const allRoutes = Array.from(new Set(trips.map(t => t.route))).sort();

  const filteredTrips = trips.filter(t => {
    const matchRoute = filterRoute ? t.route === filterRoute : true;
    const tripDate = new Date(t.routeDate).toISOString().split('T')[0];
    const matchFrom = filterDateFrom ? tripDate >= filterDateFrom : true;
    const matchTo = filterDateTo ? tripDate <= filterDateTo : true;
    return matchRoute && matchFrom && matchTo;
  });

  const handleExportAll = () => {
    const headers = ['Date', 'Route', 'Driver', 'Emp1', 'Emp2', 'Product', 'Loaded', 'Returned', 'Sold', 'Wastage', 'Damage'];
    const rows: string[] = [];
    filteredTrips.forEach(t => {
      t.inventory.forEach((inv: any) => {
        rows.push([
          new Date(t.routeDate).toLocaleDateString(),
          `"${t.route}"`, `"${t.driverName || ''}"`, `"${t.employee1Name || ''}"`, `"${t.employee2Name || ''}"`,
          `"${inv.product.name}"`, inv.loadedQty, inv.returnedQty, inv.soldQty, inv.wastage, inv.damage
        ].join(','));
      });
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trip_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <select className="input-field" value={filterRoute} onChange={e => setFilterRoute(e.target.value)}
          style={{ width: 'auto', minWidth: '100px', padding: '0.4rem' }}>
          <option value="">All Routes</option>
          {allRoutes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <input type="date" className="input-field" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            style={{ padding: '0.4rem', width: 'auto' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
          <input type="date" className="input-field" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            style={{ padding: '0.4rem', width: 'auto' }} />
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={handleExportAll}>
          <Download size={14} /> Export
        </button>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {filteredTrips.length} completed trips
      </div>

      {/* Trip Cards */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Truck size={48} color="var(--border)" />
            <p>No completed trips found.</p>
          </div>
        ) : (
          filteredTrips.map(t => {
            const isExpanded = expandedTrip === t.id;
            const totalLoaded = t.inventory.reduce((s: number, i: any) => s + i.loadedQty, 0);
            const totalSold = t.inventory.reduce((s: number, i: any) => s + i.soldQty, 0);
            const totalWastage = t.inventory.reduce((s: number, i: any) => s + i.wastage, 0);

            return (
              <div key={t.id} className="mobile-card" style={{ padding: '0.75rem' }}>
                {/* Trip Header — always visible */}
                <div onClick={() => setExpandedTrip(isExpanded ? null : t.id)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{t.route}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {new Date(t.routeDate).toLocaleDateString()} • {t.driverName}
                        {t.employee1Name ? `, ${t.employee1Name}` : ''}
                        {t.employee2Name ? `, ${t.employee2Name}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sold</div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>{totalSold} kg</div>
                      </div>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                    <span>Loaded: <strong>{totalLoaded}kg</strong></span>
                    <span>Sold: <strong style={{ color: 'var(--success)' }}>{totalSold}kg</strong></span>
                    {totalWastage > 0 && <span style={{ color: 'var(--warning)' }}>Wastage: {totalWastage}kg</span>}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    {t.inventory.map((inv: any) => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed var(--border)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 500 }}>{inv.product.name}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                          <span>Sent: {inv.loadedQty}</span>
                          <span>Back: {inv.returnedQty}</span>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Sold: {inv.soldQty}</span>
                          {inv.wastage > 0 && <span style={{ color: 'var(--warning)' }}>W: {inv.wastage}</span>}
                          {inv.damage > 0 && <span style={{ color: 'var(--danger)' }}>D: {inv.damage}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
