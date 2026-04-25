import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';
import { getAllTransactions } from '@/app/actions/transactionActions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
  const transactionsData = await getAllTransactions();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Settings & Ledger</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your team and view all financial transactions.</p>
      </header>

      <SettingsClient employees={employees} transactionsData={transactionsData} />
    </div>
  );
}
