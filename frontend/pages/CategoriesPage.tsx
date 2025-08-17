import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Grid3X3, ArrowRight, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => backend.categories.list(),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">
            Explora nuestras categorías de productos cubanos
          </p>
        </div>
        <Button asChild>
          <Link to="/products">
            <Package className="w-4 h-4 mr-2" />
            Ver Todos los Productos
          </Link>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.categories?.map((category) => (
          <Card key={category.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <Grid3X3 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
              <CardTitle className="group-hover:text-blue-600 transition-colors">
                {category.name}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {category.children && category.children.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Subcategorías:</span>
                    <Badge variant="secondary">
                      {category.children.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {category.children.slice(0, 3).map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        to={`/products?category_id=${subcategory.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-600 hover:text-blue-600">
                          {subcategory.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </Link>
                    ))}
                    {category.children.length > 3 && (
                      <Link
                        to={`/products?category_id=${category.id}`}
                        className="flex items-center justify-center p-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Ver todas ({category.children.length})
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to={`/products?category_id=${category.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver productos
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!categories?.categories || categories.categories.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <Grid3X3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay categorías disponibles
            </h3>
            <p className="text-gray-600">
              Las categorías se mostrarán aquí una vez que sean creadas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
