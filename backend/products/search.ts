import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";
import { Product } from "./list";

export interface SearchProductsParams {
  query: Query<string>;
  limit?: Query<number>;
}

export interface SearchProductsResponse {
  products: Product[];
}

// Performs semantic search on products using vector embeddings.
export const search = api<SearchProductsParams, SearchProductsResponse>(
  { expose: true, method: "GET", path: "/products/search" },
  async (params) => {
    const limit = params.limit || 10;
    
    // For now, we'll use text search. In a real implementation, 
    // you would generate embeddings for the query and use vector similarity
    const products = await ecommerceDB.rawQueryAll(`
      SELECT 
        id, name, description, category_id, base_price, final_price, 
        platform_fee, sku, weight, stock_quantity, is_active, is_combo,
        expiration_date, images, tags, created_at
      FROM products 
      WHERE is_active = TRUE 
        AND (name ILIKE $1 OR description ILIKE $1 OR $2 = ANY(tags))
      ORDER BY 
        CASE 
          WHEN name ILIKE $1 THEN 1
          WHEN description ILIKE $1 THEN 2
          ELSE 3
        END
      LIMIT $3
    `, `%${params.query}%`, params.query, limit);

    return {
      products: products.map(p => ({
        ...p,
        images: p.images || [],
        tags: p.tags || [],
        expiration_date: p.expiration_date ? p.expiration_date.toISOString().split('T')[0] : null
      }))
    };
  }
);
