import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";
import { Product } from "./list";

export interface CreateProductRequest {
  name: string;
  description?: string;
  category_id: number;
  base_price: number;
  sku?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  stock_quantity?: number;
  min_stock_level?: number;
  is_combo?: boolean;
  expiration_date?: string;
  images?: string[];
  tags?: string[];
}

// Creates a new product with automatic price calculation including platform fee.
export const create = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    const platformFee = 0.03; // 3% platform fee
    const finalPrice = req.base_price * (1 + platformFee);
    
    const result = await ecommerceDB.queryRow`
      INSERT INTO products (
        name, description, category_id, base_price, final_price, platform_fee,
        sku, weight, dimensions, stock_quantity, min_stock_level, is_combo,
        expiration_date, images, tags
      ) VALUES (
        ${req.name}, ${req.description || null}, ${req.category_id}, 
        ${req.base_price}, ${finalPrice}, ${platformFee},
        ${req.sku || null}, ${req.weight || null}, ${JSON.stringify(req.dimensions || {})},
        ${req.stock_quantity || 0}, ${req.min_stock_level || 0}, ${req.is_combo || false},
        ${req.expiration_date || null}, ${JSON.stringify(req.images || [])}, 
        ${req.tags || []}
      )
      RETURNING id, name, description, category_id, base_price, final_price, 
                platform_fee, sku, weight, stock_quantity, is_active, is_combo,
                expiration_date, images, tags, created_at
    `;

    if (!result) {
      throw new Error("Failed to create product");
    }

    return {
      ...result,
      images: result.images || [],
      tags: result.tags || [],
      expiration_date: result.expiration_date ? result.expiration_date.toISOString().split('T')[0] : null
    };
  }
);
