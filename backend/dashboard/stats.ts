import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface DashboardStatsParams {
  date_from?: Query<string>;
  date_to?: Query<string>;
}

export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  daily_sales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
  }>;
  low_stock_products: Array<{
    product_id: number;
    product_name: string;
    current_stock: number;
    min_stock_level: number;
  }>;
}

// Retrieves comprehensive dashboard statistics for business analytics.
export const stats = api<DashboardStatsParams, DashboardStats>(
  { expose: true, method: "GET", path: "/dashboard/stats" },
  async (params) => {
    const dateFrom = params.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = params.date_to || new Date().toISOString();

    // Total sales and orders
    const salesStats = await ecommerceDB.queryRow`
      SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_orders
      FROM orders 
      WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
    `;

    // Total customers
    const customerStats = await ecommerceDB.queryRow`
      SELECT COUNT(*) as total_customers FROM customers
    `;

    // Total products
    const productStats = await ecommerceDB.queryRow`
      SELECT COUNT(*) as total_products FROM products WHERE is_active = TRUE
    `;

    // Daily sales
    const dailySales = await ecommerceDB.queryAll`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total), 0) as sales,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Top products
    const topProducts = await ecommerceDB.queryAll`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ${dateFrom} AND o.created_at <= ${dateTo}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // Low stock products
    const lowStockProducts = await ecommerceDB.queryAll`
      SELECT 
        id as product_id,
        name as product_name,
        stock_quantity as current_stock,
        min_stock_level
      FROM products 
      WHERE is_active = TRUE 
        AND stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT 20
    `;

    return {
      total_sales: salesStats?.total_sales || 0,
      total_orders: salesStats?.total_orders || 0,
      total_customers: customerStats?.total_customers || 0,
      total_products: productStats?.total_products || 0,
      daily_sales: dailySales.map(d => ({
        date: d.date.toISOString().split('T')[0],
        sales: d.sales,
        orders: d.orders
      })),
      top_products: topProducts,
      low_stock_products: lowStockProducts
    };
  }
);
