import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface AdjustInventoryRequest {
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface AdjustInventoryResponse {
  success: boolean;
  new_stock_level: number;
}

// Adjusts inventory levels manually with tracking.
export const adjust = api<AdjustInventoryRequest, AdjustInventoryResponse>(
  { expose: true, method: "POST", path: "/inventory/adjust" },
  async (req) => {
    // Get current stock
    const product = await ecommerceDB.queryRow`
      SELECT stock_quantity FROM products WHERE id = ${req.product_id}
    `;

    if (!product) {
      throw new Error("Product not found");
    }

    const newStockLevel = product.stock_quantity + req.quantity;

    // Update product stock
    await ecommerceDB.exec`
      UPDATE products 
      SET stock_quantity = ${newStockLevel}
      WHERE id = ${req.product_id}
    `;

    // Record inventory movement
    await ecommerceDB.exec`
      INSERT INTO inventory_movements (product_id, movement_type, quantity, reference_type, notes)
      VALUES (${req.product_id}, 'adjustment', ${req.quantity}, 'manual_adjustment', ${req.notes || null})
    `;

    return {
      success: true,
      new_stock_level: newStockLevel
    };
  }
);
