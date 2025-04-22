import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Users, Settings, LogOut, BarChart3 } from 'lucide-react';
import { auth } from '../Firebase';
import { signOut } from 'firebase/auth';

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-900/40 via-purple-800/20 to-transparent backdrop-blur-xl border-r border-purple-500/10">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
            Tonbox Admin
          </h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Users className="w-5 h-5" />
            Users
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}