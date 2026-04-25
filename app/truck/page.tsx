import { getProducts } from '@/app/actions/productActions';
import TruckClient from './TruckClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TruckPage() {
  const products = await getProducts();
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  // Get unique routes from customers
  const customers = await prisma.customer.findMany({ select: { route: true }});
  const routes = Array.from(new Set(customers.map(c => c.route)));

  // Get orders count by date for calendar tiles (last 3 months + next 1 month)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const oneMonthAhead = new Date();
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

  const orders = await prisma.order.findMany({
    where: { routeDate: { gte: threeMonthsAgo, lte: oneMonthAhead } },
    select: { routeDate: true }
  });

  const ordersCountByDate: Record<string, number> = {};
  orders.forEach(o => {
    const dateStr = o.routeDate.toISOString().split('T')[0];
    ordersCountByDate[dateStr] = (ordersCountByDate[dateStr] || 0) + 1;
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Truck Management</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Plan routes, load inventory, settle returns.</p>
      </header>

      <TruckClient products={products} availableRoutes={routes} employees={employees} ordersCountByDate={ordersCountByDate} />
    </div>
  );
}
