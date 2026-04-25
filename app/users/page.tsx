import { getUsers } from '../actions/userActions';
import UserClient from './UserClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getUsers();
  
  return <UserClient users={users} />;
}
