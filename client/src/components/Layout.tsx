import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  CreditCard,
  LogOut,
  BarChart,
  DollarSign,
  Warehouse
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const allNavigation = [
    { name: 'Dashboard', href: '/', icon: Home, adminOnly: true },
    { name: 'PDV', href: '/pdv', icon: CreditCard, adminOnly: false },
    { name: 'Produtos', href: '/products', icon: Package, adminOnly: true },
    { name: 'Clientes', href: '/customers', icon: Users, adminOnly: false },
    { name: 'Fornecedores', href: '/suppliers', icon: Truck, adminOnly: true },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart, adminOnly: false },
    { name: 'Contas a Receber', href: '/accounts-receivable', icon: DollarSign, adminOnly: false },
    { name: 'Funcionários', href: '/users', icon: Users, adminOnly: true },
    { name: 'Estoque', href: '/locations', icon: Warehouse, adminOnly: true },
    { name: 'Caixas', href: '/supplier-boxes', icon: Package, adminOnly: true },
  ];
  
  const navigation = allNavigation.filter(item => {
    if (user?.role === 'admin') {
      return true; // Admin vê tudo
    }
    return !item.adminOnly; // Vendedor vê apenas o que não é exclusivo do admin
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-primary-600 text-white">
          <h1 className="text-xl font-bold">Hortifruti PDV</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 