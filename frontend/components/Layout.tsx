import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  ShoppingBag, 
  Grid3X3,
  Home,
  Menu,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../hooks/useCart';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Categorías', href: '/categories', icon: Grid3X3 },
    { name: 'Carrito', href: '/cart', icon: ShoppingCart, badge: cartItemCount },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Pedidos', href: '/orders', icon: ShoppingBag },
    { name: 'Inventario', href: '/inventory', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <span className="text-xl font-bold text-gray-900">CubaSaaS</span>
              </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:pt-16 bg-white border-r">
          <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4 py-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
