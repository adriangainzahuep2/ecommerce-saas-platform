import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_id: number;
  items: OrderItem[];
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  status: string;
  subtotal: number;
  platform_fee: number;
  total: number;
  items: OrderItem[];
  created_at: string;
}

// Creates a new order with automatic price calculation.
export const create = api<CreateOrderRequest, Order>(
  { expose: true, method: "POST", path: "/orders" },
  async (req) => {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate totals
    let subtotal = 0;
    const itemsWithPrices: any[] = [];

    for (const item of req.items) {
      const product = await ecommerceDB.queryRow`
        SELECT id, name, final_price, stock_quantity
        FROM products 
        WHERE id = ${item.product_id} AND is_active = TRUE
      `;

      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.final_price * item.quantity;
      subtotal += itemTotal;
      
      itemsWithPrices.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.final_price,
        total_price: itemTotal
      });
    }

    const platformFeeAmount = subtotal * 0.03;
    const total = subtotal + platformFeeAmount;

    // Create order
    const order = await ecommerceDB.queryRow`
      INSERT INTO orders (
        customer_id, order_number, subtotal, platform_fee, total,
        delivery_address, delivery_date, notes
      ) VALUES (
        ${req.customer_id}, ${orderNumber}, ${subtotal}, ${platformFeeAmount}, ${total},
        ${req.delivery_address || null}, ${req.delivery_date || null}, ${req.notes || null}
      )
      RETURNING id, order_number, customer_id, status, subtotal, platform_fee, total, created_at
    `;

    if (!order) {
      throw new Error("Failed to create order");
    }

    // Create order items and update inventory
    for (const item of itemsWithPrices) {
      await ecommerceDB.exec`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
      `;

      // Update product stock
      await ecommerceDB.exec`
        UPDATE products 
        SET stock_quantity = stock_quantity - ${item.quantity}
        WHERE id = ${item.product_id}
      `;

      // Record inventory movement
      await ecommerceDB.exec`
        INSERT INTO inventory_movements (product_id, movement_type, quantity, reference_id, reference_type)
        VALUES (${item.product_id}, 'out', ${item.quantity}, ${order.id}, 'order')
      `;
    }

    return {
      ...order,
      items: req.items
    };
  }
);
