import { getCustomers } from '@/app/actions/customerActions';
import { getProducts } from '@/app/actions/productActions';
import OrderClient from './OrderClient';

export default async function OrdersPage() {
  const customers = await getCustomers();
  const products = await getProducts();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Pre-Sales Orders</h1>
        <p style={{ color: 'var(--text-muted)' }}>Create and manage daily orders for truck delivery routes.</p>
      </header>

      <OrderClient customers={customers} products={products} />
    </div>
  );
}
