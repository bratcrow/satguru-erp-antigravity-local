import { getProducts } from '@/app/actions/productActions';
import { getCustomers } from '@/app/actions/customerActions';
import PosClient from './PosClient';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const products = await getProducts();
  const customers = await getCustomers();
  
  return (
    <div style={{ height: '100%', paddingBottom: '2rem' }}>
      <PosClient products={products} customers={customers} />
    </div>
  );
}
