import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const ecommerceDB = new SQLDatabase("ecommerce", {
  migrations: "./migrations",
});
