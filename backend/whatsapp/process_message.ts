import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface ProcessMessageRequest {
  customer_whatsapp: string;
  message_id: string;
  message_type: 'text' | 'audio' | 'image';
  content?: string;
  audio_url?: string;
  transcription?: string;
}

export interface ProcessMessageResponse {
  success: boolean;
  is_purchase_intent: boolean;
  request_id?: string;
  products_found?: Array<{
    name: string;
    type: string;
    price: number;
    description: string;
  }>;
}

// Processes WhatsApp messages and identifies purchase intent.
export const processMessage = api<ProcessMessageRequest, ProcessMessageResponse>(
  { expose: true, method: "POST", path: "/whatsapp/process-message" },
  async (req) => {
    // Find or create customer
    let customer = await ecommerceDB.queryRow`
      SELECT id FROM customers WHERE whatsapp_number = ${req.customer_whatsapp}
    `;

    if (!customer) {
      customer = await ecommerceDB.queryRow`
        INSERT INTO customers (whatsapp_number, last_activity)
        VALUES (${req.customer_whatsapp}, CURRENT_TIMESTAMP)
        RETURNING id
      `;
    }

    // Store message
    await ecommerceDB.exec`
      INSERT INTO whatsapp_messages (
        customer_id, message_id, message_type, content, audio_url, transcription
      ) VALUES (
        ${customer.id}, ${req.message_id}, ${req.message_type}, 
        ${req.content || null}, ${req.audio_url || null}, ${req.transcription || null}
      )
    `;

    // Simple purchase intent detection (in real implementation, use AI/ML)
    const text = req.content || req.transcription || '';
    const purchaseKeywords = ['quiero', 'comprar', 'precio', 'cuanto', 'disponible', 'vender'];
    const isPurchaseIntent = purchaseKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (isPurchaseIntent) {
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create purchase request
      await ecommerceDB.exec`
        INSERT INTO purchase_requests (request_id, customer_id, products_requested)
        VALUES (${requestId}, ${customer.id}, ${JSON.stringify({ query: text })})
      `;

      // Simple product search (in real implementation, use semantic search)
      const products = await ecommerceDB.queryAll`
        SELECT name, base_price as price, description
        FROM products 
        WHERE is_active = TRUE 
          AND (name ILIKE ${`%${text}%`} OR description ILIKE ${`%${text}%`})
        LIMIT 5
      `;

      return {
        success: true,
        is_purchase_intent: true,
        request_id: requestId,
        products_found: products.map(p => ({
          name: p.name,
          type: 'product',
          price: p.price,
          description: p.description || ''
        }))
      };
    }

    return {
      success: true,
      is_purchase_intent: false
    };
  }
);
