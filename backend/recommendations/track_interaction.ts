import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface TrackInteractionRequest {
  customer_id: number;
  product_id: number;
  interaction_type: 'view' | 'click' | 'cart_add' | 'purchase';
  duration_seconds?: number;
}

export interface TrackInteractionResponse {
  success: boolean;
}

// Tracks customer interactions with products for recommendation algorithm.
export const trackInteraction = api<TrackInteractionRequest, TrackInteractionResponse>(
  { expose: true, method: "POST", path: "/recommendations/track" },
  async (req) => {
    await ecommerceDB.exec`
      INSERT INTO customer_interactions (
        customer_id, product_id, interaction_type, duration_seconds
      ) VALUES (
        ${req.customer_id}, ${req.product_id}, ${req.interaction_type}, ${req.duration_seconds || null}
      )
    `;

    return { success: true };
  }
);
