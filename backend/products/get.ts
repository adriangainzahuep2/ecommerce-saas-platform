import { api, APIError } from "encore.dev/api";
import { ecommerceDB } from "../database/db";
import { Product } from "./list";

export interface GetProductParams {
  id: number;
}

// Retrieves a specific product by ID.
export const get = api<GetProductParams, Product>(
  { expose: true, method: "GET", path: "/products/:id" },
  async (params) => {
    const product = await ecommerceDB.queryRow`
      SELECT 
        id, name, description, category_id, base_price, final_price, 
        platform_fee, sku, weight, stock_quantity, is_active, is_combo,
        expiration_date, images, tags, created_at
      FROM products 
      WHERE id = ${params.id} AND is_active = TRUE
    `;

    if (!product) {
      throw APIError.notFound("Product not found");
    }

    return {
      ...product,
      images: product.images || [],
      tags: product.tags || [],
      expiration_date: product.expiration_date ? product.expiration_date.toISOString().split('T')[0] : null
    };
  }
);
