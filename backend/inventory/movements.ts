import { api, Query } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: string;
  quantity: number;
  reference_id: number | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface ListMovementsParams {
  product_id?: Query<number>;
  movement_type?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListMovementsResponse {
  movements: InventoryMovement[];
  total: number;
}

// Retrieves inventory movements for tracking stock changes.
export const listMovements = api<ListMovementsParams, ListMovementsResponse>(
  { expose: true, method: "GET", path: "/inventory/movements" },
  async (params) => {
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    
    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.product_id) {
      whereClause += ` AND im.product_id = $${paramIndex}`;
      queryParams.push(params.product_id);
      paramIndex++;
    }

    if (params.movement_type) {
      whereClause += ` AND im.movement_type = $${paramIndex}`;
      queryParams.push(params.movement_type);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_movements im
      ${whereClause}
    `;

    const movementsQuery = `
      SELECT 
        im.id, im.product_id, p.name as product_name, im.movement_type,
        im.quantity, im.reference_id, im.reference_type, im.notes, im.created_at
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countResult = await ecommerceDB.rawQueryRow(countQuery, ...queryParams);
    const total = countResult?.total || 0;

    const movements = await ecommerceDB.rawQueryAll(
      movementsQuery, 
      ...queryParams, 
      limit, 
      offset
    );

    return {
      movements,
      total
    };
  }
);
