import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', status, page],
    queryFn: () => backend.orders.list({
      status: status || undefined,
      limit,
      offset,
    }),
  });

  const handleStatusChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('status', value);
    } else {
      newParams.delete('status');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const totalPages = Math.ceil((orders?.total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos los pedidos de tu tienda
          </p>
        </div>
        <Button>
          Crear Pedido Manual
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por número de pedido o cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders?.orders?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron pedidos
              </h3>
              <p className="text-gray-600">
                No hay pedidos que coincidan con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          orders?.orders?.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Cliente: {order.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'pending' && 'Pendiente'}
                          {order.status === 'processing' && 'Procesando'}
                          {order.status === 'completed' && 'Completado'}
                          {order.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
