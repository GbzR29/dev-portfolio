import { getUsers } from "@/services/userService";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Usuários</h1>
      <ul className="grid gap-4">
        {users.map((user) => (
          <li key={user._id.toString()} className="p-4 bg-white shadow rounded-lg">
            {user.name} - <span className="text-gray-500">{user.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}