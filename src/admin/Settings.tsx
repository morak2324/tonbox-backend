import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  addedBy: string;
  addedAt: Date;
}

export function Settings() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'viewer' as const });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const adminsRef = collection(db, 'admins');
      const snapshot = await getDocs(adminsRef);
      const adminData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
      setAdmins(adminData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const adminId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'admins', adminId), {
        ...newAdmin,
        addedBy: 'morakgeorge@gmail.com',
        addedAt: new Date()
      });
      
      toast.success('Admin added successfully');
      setNewAdmin({ email: '', role: 'viewer' });
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      toast.success('Admin removed successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Admin Form */}
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-purple-500/10">
          <h2 className="text-xl font-semibold mb-6">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as 'admin' | 'viewer' })}
                className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Admin
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl rounded-3xl p-6 border border-purple-500/10">
          <h2 className="text-xl font-semibold mb-6">Admin List</h2>
          <div className="space-y-4">
            {admins.map(admin => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${
                    admin.role === 'admin' ? 'text-purple-400' : 'text-blue-400'
                  }`} />
                  <div>
                    <p className="font-medium">{admin.email}</p>
                    <p className="text-sm text-gray-400 capitalize">{admin.role}</p>
                  </div>
                </div>
                {admin.email !== 'morakgeorge@gmail.com' && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}