import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface GenerateRecommendationsParams {
  customer_id: number;
}

export interface RecommendationItem {
  product_id: number;
  product_name: string;
  score: number;
  reason: string;
}

export interface GenerateRecommendationsResponse {
  recommendations: RecommendationItem[];
}

// Generates product recommendations using TikTok-style algorithm based on user interactions.
export const generate = api<GenerateRecommendationsParams, GenerateRecommendationsResponse>(
  { expose: true, method: "POST", path: "/recommendations/generate/:customer_id" },
  async (params) => {
    // Get customer interaction history
    const interactions = await ecommerceDB.queryAll`
      SELECT 
        ci.product_id,
        ci.interaction_type,
        ci.duration_seconds,
        p.name as product_name,
        p.category_id
      FROM customer_interactions ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.customer_id = ${params.customer_id}
        AND ci.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY ci.created_at DESC
    `;

    // Calculate engagement scores (TikTok-style)
    const productScores = new Map<number, number>();
    const categoryScores = new Map<number, number>();

    interactions.forEach(interaction => {
      let score = 0;
      
      switch (interaction.interaction_type) {
        case 'view':
          score = 1;
          break;
        case 'click':
          score = 3;
          break;
        case 'cart_add':
          score = 5;
          break;
        case 'purchase':
          score = 10;
          break;
      }

      // Add duration bonus (more time = more interest)
      if (interaction.duration_seconds) {
        score += Math.min(interaction.duration_seconds / 10, 5);
      }

      productScores.set(
        interaction.product_id, 
        (productScores.get(interaction.product_id) || 0) + score
      );

      categoryScores.set(
        interaction.category_id,
        (categoryScores.get(interaction.category_id) || 0) + score
      );
    });

    // Get recommendations based on categories with high engagement
    const topCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    if (topCategories.length === 0) {
      // No interaction history, recommend popular products
      const popularProducts = await ecommerceDB.queryAll`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          COUNT(oi.id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.is_active = TRUE
        GROUP BY p.id, p.name
        ORDER BY order_count DESC
        LIMIT 10
      `;

      return {
        recommendations: popularProducts.map(p => ({
          product_id: p.product_id,
          product_name: p.product_name,
          score: 0.5,
          reason: 'Popular product'
        }))
      };
    }

    // Get products from preferred categories
    const recommendations = await ecommerceDB.rawQueryAll(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category_id,
        COUNT(oi.id) as popularity
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.is_active = TRUE 
        AND p.category_id = ANY($1)
        AND p.id NOT IN (
          SELECT DISTINCT product_id 
          FROM customer_interactions 
          WHERE customer_id = $2 AND interaction_type = 'purchase'
        )
      GROUP BY p.id, p.name, p.category_id
      ORDER BY popularity DESC
      LIMIT 15
    `, topCategories, params.customer_id);

    // Calculate final scores
    const finalRecommendations = recommendations.map(rec => {
      const categoryScore = categoryScores.get(rec.category_id) || 0;
      const popularityScore = rec.popularity || 0;
      const finalScore = (categoryScore * 0.7) + (popularityScore * 0.3);

      return {
        product_id: rec.product_id,
        product_name: rec.product_name,
        score: Math.min(finalScore / 10, 1), // Normalize to 0-1
        reason: `Based on your interest in this category`
      };
    });

    // Store recommendations
    for (const rec of finalRecommendations) {
      await ecommerceDB.exec`
        INSERT INTO recommendations (customer_id, product_id, score, algorithm)
        VALUES (${params.customer_id}, ${rec.product_id}, ${rec.score}, 'tiktok_style')
        ON CONFLICT (customer_id, product_id) DO UPDATE SET
          score = EXCLUDED.score,
          created_at = CURRENT_TIMESTAMP
      `;
    }

    return {
      recommendations: finalRecommendations.slice(0, 10)
    };
  }
);
