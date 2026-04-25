import { getProducts } from '@/app/actions/productActions';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Inventory & Recipes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your finished goods and raw materials.</p>
      </header>

      <InventoryClient initialProducts={products} />
    </div>
  );
}
