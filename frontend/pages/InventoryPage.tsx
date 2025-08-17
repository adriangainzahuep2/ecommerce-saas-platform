import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, Minus, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import backend from '~backend/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { useToast } from '@/components/ui/use-toast';

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustmentDialog, setAdjustmentDialog] = useState<{ open: boolean; product?: any }>({ open: false });
  const [adjustmentData, setAdjustmentData] = useState({ quantity: 0, notes: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const page = parseInt(searchParams.get('page') || '1');
  const movementType = searchParams.get('movement_type');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: () => backend.products.list({ limit: 100 }),
  });

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-movements', movementType, page],
    queryFn: () => backend.inventory.listMovements({
      movement_type: movementType || undefined,
      limit,
      offset,
    }),
  });

  const adjustInventoryMutation = useMutation({
    mutationFn: (data: { product_id: number; quantity: number; notes?: string }) =>
      backend.inventory.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setAdjustmentDialog({ open: false });
      setAdjustmentData({ quantity: 0, notes: '' });
      toast({
        title: "Inventario ajustado",
        description: "El stock del producto ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error adjusting inventory:', error);
      toast({
        title: "Error",
        description: "No se pudo ajustar el inventario",
        variant: "destructive",
      });
    },
  });

  const handleMovementTypeChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('movement_type', value);
    } else {
      newParams.delete('movement_type');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleAdjustInventory = () => {
    if (!adjustmentDialog.product || adjustmentData.quantity === 0) return;

    adjustInventoryMutation.mutate({
      product_id: adjustmentDialog.product.id,
      quantity: adjustmentData.quantity,
      notes: adjustmentData.notes || undefined,
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'out':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'adjustment':
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (productsLoading || movementsLoading) {
    return <LoadingSpinner />;
  }

  const lowStockProducts = products?.products?.filter(p => p.stock_quantity <= p.min_stock_level || 0) || [];
  const totalPages = Math.ceil((movements?.total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1">
            Controla el stock y movimientos de tus productos
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products?.products?.length || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {lowStockProducts.length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  ${products?.products?.reduce((sum, p) => sum + (p.final_price * p.stock_quantity), 0)?.toLocaleString() || '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Productos con Stock Bajo
            </CardTitle>
            <CardDescription className="text-orange-700">
              Los siguientes productos necesitan reposición urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock_quantity} / Mínimo: {product.min_stock_level || 0}
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setAdjustmentDialog({ open: true, product })}
                      >
                        Ajustar
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
          <CardDescription>
            Lista completa de productos con sus niveles de stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-2">
              {products?.products
                ?.filter(product => 
                  !searchQuery || 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                ?.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.images?.[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Stock Actual</p>
                      <p className={`font-semibold ${
                        product.stock_quantity <= (product.min_stock_level || 0) 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {product.stock_quantity}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Mínimo</p>
                      <p className="font-semibold text-gray-900">
                        {product.min_stock_level || 0}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">Valor</p>
                      <p className="font-semibold text-gray-900">
                        ${(product.final_price * product.stock_quantity).toFixed(2)}
                      </p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustmentDialog({ open: true, product })}
                        >
                          Ajustar Stock
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Movements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimientos de Inventario</CardTitle>
              <CardDescription>
                Historial de entradas, salidas y ajustes de stock
              </CardDescription>
            </div>
            <Select value={movementType || 'all'} onValueChange={handleMovementTypeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los movimientos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los movimientos</SelectItem>
                <SelectItem value="in">Entradas</SelectItem>
                <SelectItem value="out">Salidas</SelectItem>
                <SelectItem value="adjustment">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movements?.movements?.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getMovementIcon(movement.movement_type)}
                  <div>
                    <h3 className="font-medium text-gray-900">{movement.product_name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(movement.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Badge className={getMovementColor(movement.movement_type)}>
                    {movement.movement_type === 'in' && 'Entrada'}
                    {movement.movement_type === 'out' && 'Salida'}
                    {movement.movement_type === 'adjustment' && 'Ajuste'}
                  </Badge>
                  <span className={`font-semibold ${
                    movement.movement_type === 'in' ? 'text-green-600' : 
                    movement.movement_type === 'out' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '±'}
                    {Math.abs(movement.quantity)}
                  </span>
                  {movement.notes && (
                    <p className="text-sm text-gray-500 max-w-xs truncate">
                      {movement.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {(!movements?.movements || movements.movements.length === 0) && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay movimientos
                </h3>
                <p className="text-gray-600">
                  Los movimientos de inventario aparecerán aquí
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialog.open} onOpenChange={(open) => setAdjustmentDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              Ajusta el stock del producto: {adjustmentDialog.product?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-stock">Stock Actual</Label>
              <Input
                id="current-stock"
                value={adjustmentDialog.product?.stock_quantity || 0}
                disabled
              />
            </div>
            
            <div>
              <Label htmlFor="adjustment">Ajuste de Cantidad</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustmentData(prev => ({ ...prev, quantity: prev.quantity - 1 }))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustmentData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Nuevo stock: {(adjustmentDialog.product?.stock_quantity || 0) + adjustmentData.quantity}
              </p>
            </div>
            
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Razón del ajuste..."
                value={adjustmentData.notes}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustmentDialog({ open: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdjustInventory}
              disabled={adjustmentData.quantity === 0 || adjustInventoryMutation.isPending}
            >
              {adjustInventoryMutation.isPending ? 'Ajustando...' : 'Ajustar Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
