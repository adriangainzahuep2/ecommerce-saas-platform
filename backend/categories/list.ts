import { api } from "encore.dev/api";
import { ecommerceDB } from "../database/db";

export interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  image_url: string | null;
  is_active: boolean;
  children?: Category[];
}

export interface ListCategoriesResponse {
  categories: Category[];
}

// Retrieves all categories with their hierarchical structure.
export const list = api<void, ListCategoriesResponse>(
  { expose: true, method: "GET", path: "/categories" },
  async () => {
    const categories = await ecommerceDB.queryAll`
      SELECT id, name, description, parent_id, image_url, is_active
      FROM categories 
      WHERE is_active = TRUE
      ORDER BY parent_id NULLS FIRST, name
    `;

    // Build hierarchical structure
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // First pass: create all categories
    categories.forEach(cat => {
      const category: Category = {
        ...cat,
        children: []
      };
      categoryMap.set(cat.id, category);
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return { categories: rootCategories };
  }
);
