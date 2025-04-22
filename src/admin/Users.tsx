import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { Edit2, Trash2, Search, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../types/user';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm(user);
  };

  const handleSave = async () => {
    if (!editingUser || !editForm) return;

    try {
      const userRef = doc(db, 'users', editingUser);
      await updateDoc(userRef, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl border border-purple-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Username</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Points</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Invites</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Early Adopter</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editForm.username || ''}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="bg-white/10 px-2 py-1 rounded"
                      />
                    ) : (
                      user.username || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <input
                        type="number"
                        value={editForm.points || 0}
                        onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) })}
                        className="bg-white/10 px-2 py-1 rounded w-24"
                      />
                    ) : (
                      user.points?.toLocaleString() || '0'
                    )}
                  </td>
                  <td className="px-6 py-4">{user.totalInvites || 0}</td>
                  <td className="px-6 py-4">
                    {user.isEarlyAdopter ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSave}
                          className="p-1 hover:bg-green-500/20 rounded-lg transition-colors"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}