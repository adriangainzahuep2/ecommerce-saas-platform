import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface SalesReportParams {
  date_from: Query<string>;
  date_to: Query<string>;
  group_by?: Query<'day' | 'week' | 'month'>;
}

export interface SalesReportResponse {
  period: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  platform_fees: number;
  net_revenue: number;
}

export interface SalesReportResult {
  report: SalesReportResponse[];
  summary: {
    total_sales: number;
    total_orders: number;
    total_platform_fees: number;
    total_net_revenue: number;
  };
}

// Generates detailed sales reports with grouping options for accounting.
export const salesReport = api<SalesReportParams, SalesReportResult>(
  { expose: true, method: "GET", path: "/dashboard/sales-report" },
  async (params) => {
    const groupBy = params.group_by || 'day';
    
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = "DATE_TRUNC('week', created_at)";
        break;
      case 'month':
        dateFormat = "DATE_TRUNC('month', created_at)";
        break;
      default:
        dateFormat = "DATE(created_at)";
    }

    const reportData = await ecommerceDB.rawQueryAll(`
      SELECT 
        ${dateFormat} as period,
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as average_order_value,
        COALESCE(SUM(platform_fee), 0) as platform_fees,
        COALESCE(SUM(subtotal), 0) as net_revenue
      FROM orders 
      WHERE created_at >= $1 AND created_at <= $2
        AND status != 'cancelled'
      GROUP BY ${dateFormat}
      ORDER BY period DESC
    `, params.date_from, params.date_to);

    const summary = await ecommerceDB.rawQueryRow(`
      SELECT 
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(SUM(platform_fee), 0) as total_platform_fees,
        COALESCE(SUM(subtotal), 0) as total_net_revenue
      FROM orders 
      WHERE created_at >= $1 AND created_at <= $2
        AND status != 'cancelled'
    `, params.date_from, params.date_to);

    return {
      report: reportData.map(row => ({
        period: row.period.toISOString().split('T')[0],
        total_sales: row.total_sales,
        total_orders: row.total_orders,
        average_order_value: row.average_order_value,
        platform_fees: row.platform_fees,
        net_revenue: row.net_revenue
      })),
      summary: summary || {
        total_sales: 0,
        total_orders: 0,
        total_platform_fees: 0,
        total_net_revenue: 0
      }
    };
  }
);
