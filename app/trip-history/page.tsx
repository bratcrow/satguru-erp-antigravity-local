import { getCompletedTrips } from '@/app/actions/truckActions';
import TripHistoryClient from './TripHistoryClient';

export const dynamic = 'force-dynamic';

export default async function TripHistoryPage() {
  const trips = await getCompletedTrips();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Trip History</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>All completed truck trips with full details.</p>
      </header>
      <TripHistoryClient trips={trips} />
    </div>
  );
}
