import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface OrderListItem {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

export interface ListOrdersParams {
  status?: Query<string>;
  customer_id?: Query<number>;
  limit?: Query<number>;
  offset?: Query<number>;
  date_from?: Query<string>;
  date_to?: Query<string>;
}

export interface ListOrdersResponse {
  orders: OrderListItem[];
  total: number;
}

// Retrieves orders with filtering and pagination for dashboard.
export const list = api<ListOrdersParams, ListOrdersResponse>(
  { expose: true, method: "GET", path: "/orders" },
  async (params) => {
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      queryParams.push(params.status);
      paramIndex++;
    }

    if (params.customer_id) {
      whereClause += ` AND o.customer_id = $${paramIndex}`;
      queryParams.push(params.customer_id);
      paramIndex++;
    }

    if (params.date_from) {
      whereClause += ` AND o.created_at >= $${paramIndex}`;
      queryParams.push(params.date_from);
      paramIndex++;
    }

    if (params.date_to) {
      whereClause += ` AND o.created_at <= $${paramIndex}`;
      queryParams.push(params.date_to);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;

    const ordersQuery = `
      SELECT 
        o.id, o.order_number, o.customer_id, c.name as customer_name,
        o.status, o.total, o.created_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await ecommerceDB.rawQueryRow(countQuery, ...queryParams);
    const total = countResult?.total || 0;

    const orders = await ecommerceDB.rawQueryAll(
      ordersQuery, 
      ...queryParams, 
      limit, 
      offset
    );

    return {
      orders: orders.map(o => ({
        ...o,
        customer_name: o.customer_name || 'Unknown Customer'
      })),
      total
    };
  }
);
