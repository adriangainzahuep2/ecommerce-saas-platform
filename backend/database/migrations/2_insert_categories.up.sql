-- migrate:up version:2

-- Insert main categories
INSERT INTO categories (name, description, parent_id) VALUES
('Motores y Vehículos', 'Motores, motorinas y accesorios para vehículos', NULL),
('Souvenirs', 'Recuerdos y artículos conmemorativos', NULL),
('Cerámica y Arte', 'Obras de arte, cerámica y artesanías', NULL),
('Ropa y Calzado', 'Vestimenta, zapatos y accesorios', NULL),
('Comida Cubana', 'Productos alimenticios tradicionales cubanos', NULL);

-- Insert subcategories for Motores y Vehículos
INSERT INTO categories (name, description, parent_id) VALUES
('Motores', 'Motores para vehículos', 1),
('Motorinas', 'Motorinas y scooters', 1),
('Repuestos', 'Repuestos y accesorios para vehículos', 1);

-- Insert subcategories for Ropa y Calzado
INSERT INTO categories (name, description, parent_id) VALUES
('Ropa Masculina', 'Ropa para hombres', 4),
('Ropa Femenina', 'Ropa para mujeres', 4),
('Zapatos', 'Calzado en general', 4),
('Pullovers', 'Suéteres y pullovers', 4);

-- Insert subcategories for Comida Cubana
INSERT INTO categories (name, description, parent_id) VALUES
('Platos Principales', 'Comidas principales cubanas', 5),
('Postres', 'Postres tradicionales cubanos', 5),
('Bebidas', 'Bebidas típicas cubanas', 5),
('Combos', 'Combos de comida cubana', 5);
