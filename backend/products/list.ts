import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  base_price: number;
  final_price: number;
  platform_fee: number;
  sku: string;
  weight: number;
  stock_quantity: number;
  is_active: boolean;
  is_combo: boolean;
  expiration_date: string | null;
  images: string[];
  tags: string[];
  created_at: string;
}

export interface ListProductsParams {
  category_id?: Query<number>;
  search?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
  is_combo?: Query<boolean>;
}

export interface ListProductsResponse {
  products: Product[];
  total: number;
}

// Retrieves all products with optional filtering and pagination.
export const list = api<ListProductsParams, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async (params) => {
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    let whereClause = "WHERE p.is_active = TRUE";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.category_id) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(params.category_id);
      paramIndex++;
    }

    if (params.search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }

    if (params.is_combo !== undefined) {
      whereClause += ` AND p.is_combo = $${paramIndex}`;
      queryParams.push(params.is_combo);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const productsQuery = `
      SELECT 
        p.id, p.name, p.description, p.category_id, p.base_price, 
        p.final_price, p.platform_fee, p.sku, p.weight, p.stock_quantity,
        p.is_active, p.is_combo, p.expiration_date, p.images, p.tags, p.created_at
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await ecommerceDB.rawQueryRow(countQuery, ...queryParams);
    const total = countResult?.total || 0;

    const products = await ecommerceDB.rawQueryAll(
      productsQuery, 
      ...queryParams, 
      limit, 
      offset
    );

    return {
      products: products.map(p => ({
        ...p,
        images: p.images || [],
        tags: p.tags || [],
        expiration_date: p.expiration_date ? p.expiration_date.toISOString().split('T')[0] : null
      })),
      total
    };
  }
);
