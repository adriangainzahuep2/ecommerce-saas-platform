import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, Heart, Share2, Star, Package, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import backend from '~backend/client';
import { useCart } from '../hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => backend.products.get({ id: parseInt(id!) }),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Producto no encontrado
        </h2>
        <Button asChild>
          <Link to="/products">Volver a productos</Link>
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.final_price,
      quantity,
      image: product.images[0] || '/placeholder-product.jpg'
    });

    toast({
      title: "Producto agregado",
      description: `${quantity} ${product.name} agregado al carrito`,
    });
  };

  const images = product.images?.length > 0 ? product.images : ['/placeholder-product.jpg'];
  const isLowStock = product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600">Productos</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link to="/products">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
              />
            </CardContent>
          </Card>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`border-2 rounded-lg overflow-hidden ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-sm text-gray-600">(4.5) 24 reseñas</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              {product.is_combo && (
                <Badge variant="secondary">Combo</Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge variant="destructive">Stock Bajo</Badge>
              )}
              {isOutOfStock && (
                <Badge variant="destructive">Sin Stock</Badge>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                ${product.final_price.toFixed(2)}
              </span>
              {product.base_price !== product.final_price && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.base_price.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Incluye comisión de plataforma (3%)
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Stock Info */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Stock disponible: {product.stock_quantity} unidades
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Envío gratuito</span>
            </div>
          </div>

          <Separator />

          {/* Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Cantidad:</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={product.stock_quantity}
                className="w-20"
                disabled={isOutOfStock}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Sin Stock' : 'Agregar al Carrito'}
              </Button>
              <Button variant="outline" size="lg">
                Comprar Ahora
              </Button>
            </div>
          </div>

          {/* Product Details */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles del Producto</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium">{product.sku || 'N/A'}</span>
                </div>
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-medium">{product.weight} kg</span>
                  </div>
                )}
                {product.expiration_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de vencimiento:</span>
                    <span className="font-medium">{product.expiration_date}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">ID: {product.category_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
