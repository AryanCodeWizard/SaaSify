import {
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Globe, label: 'Domains', path: '/dashboard/domains' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  return (
    <aside className="w-64 bg-white shadow-2xl flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="group">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
            SaaSify
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Domain Management</p>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1.5">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                }`}
              >
                <item.icon size={20} className={isActive(item.path) ? 'drop-shadow-sm' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-semibold">{item.label}</span>
                {isActive(item.path) && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm"></span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 w-full transition-all duration-200 hover:scale-105 hover:shadow-md border-2 border-transparent hover:border-red-200"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold">Logout</span>
        </button>
      </div>
    </aside>
  );
}
