import { getCustomers } from '@/app/actions/customerActions';
import CustomerClient from './CustomerClient';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Customer Directory</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage wholesale and retail customers across different routes.</p>
      </header>

      <CustomerClient initialCustomers={customers} />
    </div>
  );
}
