import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import backend from '~backend/client';
import LoadingSpinner from '../components/LoadingSpinner';
import SalesChart from '../components/SalesChart';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('30');

  const dateFrom = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
  const dateTo = new Date().toISOString();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', dateFrom, dateTo],
    queryFn: () => backend.dashboard.stats({ date_from: dateFrom, date_to: dateTo }),
  });

  const { data: salesReport, isLoading: reportLoading } = useQuery({
    queryKey: ['sales-report', dateFrom, dateTo],
    queryFn: () => backend.dashboard.salesReport({ 
      date_from: dateFrom, 
      date_to: dateTo,
      group_by: 'day'
    }),
  });

  if (statsLoading || reportLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Ventas Totales',
      value: `$${stats?.total_sales?.toLocaleString() || '0'}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Pedidos',
      value: stats?.total_orders?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Package,
    },
    {
      title: 'Clientes',
      value: stats?.total_customers?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Productos Activos',
      value: stats?.total_products?.toLocaleString() || '0',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen de tu negocio y métricas clave
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">{stat.title}</span>
                  </div>
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ventas Diarias</CardTitle>
            <CardDescription>
              Evolución de las ventas en los últimos {dateRange} días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats?.daily_sales || []} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>
              Productos con mayor volumen de ventas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.top_products?.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.product_name}</p>
                      <p className="text-sm text-gray-500">{product.total_sold} vendidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${product.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos que necesitan reposición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.low_stock_products?.slice(0, 5).map((product) => (
                <div key={product.product_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <Badge variant="outline" className="text-orange-600">
                      {product.current_stock} restantes
                    </Badge>
                  </div>
                  <Progress 
                    value={(product.current_stock / (product.min_stock_level * 2)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    Mínimo requerido: {product.min_stock_level}
                  </p>
                </div>
              ))}
              {(!stats?.low_stock_products || stats.low_stock_products.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  ¡Todos los productos tienen stock suficiente!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
          <CardDescription>
            Desglose de ingresos y comisiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${salesReport?.summary?.total_sales?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-600">Ventas Brutas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                ${salesReport?.summary?.total_platform_fees?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-600">Comisiones (3%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                ${salesReport?.summary?.total_net_revenue?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-600">Ingresos Netos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
