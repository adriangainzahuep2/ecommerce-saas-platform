import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import type { Product } from '~backend/products/list';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.final_price,
      quantity: 1,
      image: product.images[0] || '/placeholder-product.jpg'
    });

    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó al carrito`,
    });
  };

  const productImage = product.images?.[0] || '/placeholder-product.jpg';
  const isCombo = product.is_combo;
  const isLowStock = product.stock_quantity <= 5;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <Link to={`/products/${product.id}`} className="flex">
            <div className="w-32 h-32 flex-shrink-0">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-full object-cover rounded-l-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <div className="flex-1 p-4 flex justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex gap-1 ml-4">
                    {isCombo && (
                      <Badge variant="secondary">Combo</Badge>
                    )}
                    {isLowStock && (
                      <Badge variant="destructive">Stock Bajo</Badge>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.final_price.toFixed(2)}
                    </span>
                    {product.base_price !== product.final_price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${product.base_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Stock: {product.stock_quantity}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
      <CardContent className="p-0">
        <Link to={`/products/${product.id}`}>
          <div className="relative">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
            <div className="absolute top-2 left-2 flex gap-1">
              {isCombo && (
                <Badge variant="secondary">Combo</Badge>
              )}
              {isLowStock && (
                <Badge variant="destructive">Stock Bajo</Badge>
              )}
            </div>
            <div className="absolute top-2 right-2">
              <div className="bg-white rounded-full p-1 shadow-md">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xl font-bold text-gray-900">
                  ${product.final_price.toFixed(2)}
                </span>
                {product.base_price !== product.final_price && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    ${product.base_price.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Stock: {product.stock_quantity}
              </span>
            </div>
          </div>
        </Link>
        
        <div className="px-4 pb-4">
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock_quantity === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
