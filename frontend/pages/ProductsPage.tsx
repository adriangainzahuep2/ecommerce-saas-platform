import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const categoryId = searchParams.get('category_id');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', categoryId, search, page],
    queryFn: () => backend.products.list({
      category_id: categoryId ? parseInt(categoryId) : undefined,
      search: search || undefined,
      limit,
      offset,
    }),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => backend.categories.list(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set('category_id', value);
    } else {
      newParams.delete('category_id');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  if (productsLoading || categoriesLoading) {
    return <LoadingSpinner />;
  }

  const totalPages = Math.ceil((products?.total || 0) / limit);
  const selectedCategory = categories?.categories?.find(c => c.id.toString() === categoryId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            {products?.total || 0} productos encontrados
            {selectedCategory && ` en ${selectedCategory.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
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
            </form>

            {/* Category Filter */}
            <Select value={categoryId || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories?.categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {(search || categoryId) && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="px-3 py-1">
              Búsqueda: "{search}"
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('search');
                  setSearchParams(newParams);
                  setSearchQuery('');
                }}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="px-3 py-1">
              Categoría: {selectedCategory.name}
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('category_id');
                  setSearchParams(newParams);
                }}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {products?.products?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {products?.products?.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
