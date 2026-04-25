import { Package, TrendingUp, AlertCircle, Truck, Users, IndianRupee } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch real data
  const totalProducts = await prisma.product.count();
  const lowStockProducts = await prisma.product.count({ where: { stock: { lt: 10 } } });
  const totalCustomers = await prisma.customer.count();
  
  // Pending balance across all customers
  const pendingResult = await prisma.customer.aggregate({ _sum: { pendingBalance: true } });
  const totalPending = pendingResult._sum.pendingBalance || 0;
  
  const todayOrders = await prisma.order.findMany({
    where: { routeDate: { gte: today, lt: tomorrow } }
  });
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const activeTrucks = await prisma.truckTrip.count({
    where: { routeDate: { gte: today, lt: tomorrow }, status: 'OUT' }
  });
  
  const plannedTrucks = await prisma.truckTrip.count({
    where: { routeDate: { gte: today, lt: tomorrow }, status: 'PLANNED' }
  });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back to Hari Har Namkeen ERP.</p>
      </header>

      {/* Stat Cards — 2-col on mobile, auto-fit on desktop */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Today's Sales" 
          value={`₹${todaySales.toLocaleString()}`} 
          icon={<TrendingUp size={22} color="var(--success)" />} 
          trend={`${todayOrders.length} orders today`}
        />
        <StatCard 
          title="Pending Balance" 
          value={`₹${totalPending.toLocaleString()}`} 
          icon={<IndianRupee size={22} color="var(--danger)" />} 
          trend="Total outstanding"
        />
        <StatCard 
          title="Active Trucks" 
          value={`${activeTrucks}`} 
          icon={<Truck size={22} color="var(--primary)" />} 
          trend={`${plannedTrucks} waiting`}
        />
        <StatCard 
          title="Customers" 
          value={`${totalCustomers}`} 
          icon={<Users size={22} color="var(--secondary)" />} 
          trend="Total registered"
        />
        <StatCard 
          title="Products" 
          value={`${totalProducts}`} 
          icon={<Package size={22} color="var(--warning)" />} 
          trend="In warehouse"
        />
        <StatCard 
          title="Low Stock" 
          value={`${lowStockProducts}`} 
          icon={<AlertCircle size={22} color="var(--danger)" />} 
          trend="Stock < 10kg"
        />
      </div>

      {/* Recent Orders — Table on desktop, Cards on mobile */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Recent Orders</h2>
        
        {/* Desktop table */}
        <div className="glass-panel desktop-only" style={{ background: 'var(--surface)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>No recent orders.</td></tr>
              ) : (
                recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.createdAt.toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{o.customer.name}</td>
                    <td>{o.customer.route}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{o.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-only">
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No recent orders.</p>
          ) : (
            recentOrders.map(o => (
              <div key={o.id} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.customer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {o.customer.route} • {o.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                    ₹{o.total}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
        }
      `}} />
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{title}</h3>
        <div style={{ padding: '0.4rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trend}</div>
    </div>
  );
}
