import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => backend.dashboard.stats(),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => backend.products.list({ limit: 8 }),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => backend.categories.list(),
  });

  if (statsLoading || productsLoading || categoriesLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Ventas Totales',
      value: `$${stats?.total_sales?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pedidos',
      value: stats?.total_orders?.toLocaleString() || '0',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clientes',
      value: stats?.total_customers?.toLocaleString() || '0',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Productos',
      value: stats?.total_products?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenido a CubaSaaS
          </h1>
          <p className="text-xl mb-6 text-blue-100">
            Tu plataforma completa de comercio electrónico para productos cubanos. 
            Gestiona ventas, inventario y clientes desde un solo lugar.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link to="/products">
                Ver Productos <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link to="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categorías Principales</h2>
          <Button asChild variant="outline">
            <Link to="/categories">
              Ver Todas <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories?.categories?.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to={`/products?category_id=${category.id}`}
              className="group"
            >
              <Card className="hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {category.name}
                  </h3>
                  {category.children && category.children.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      {category.children.length} subcategorías
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Productos Destacados</h2>
          <Button asChild variant="outline">
            <Link to="/products">
              Ver Todos <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.products?.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona tu negocio de manera eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4 flex-col space-y-2">
              <Link to="/products/new">
                <Package className="w-6 h-6" />
                <span>Agregar Producto</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Link to="/orders">
                <TrendingUp className="w-6 h-6" />
                <span>Ver Pedidos</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
              <Link to="/inventory">
                <Package className="w-6 h-6" />
                <span>Gestionar Inventario</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
