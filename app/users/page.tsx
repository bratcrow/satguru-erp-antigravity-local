import { getUsers } from '../actions/userActions';
import UserClient from './UserClient';

export default async function UsersPage() {
  const users = await getUsers();
  
  return <UserClient users={users} />;
}
