-- Ejecutar después de schema.sql para cargar el catálogo actual (una sola vez)

insert into products (name, category, price, condition, details, images, sold, sort_order) values
('Gorra Realtree Whiskey Jam', 'gorras', 35000, '10/10', 'Regulable con broche.', array['assets/products/gorra-whiskey-jam.jpg'], false, 1),
('Jean Baggy Zoo York', 'pantalones', 70000, '10/10', '104 cm de largo · 45 cm de cintura.', array['assets/products/jean-zoo-york.jpg'], false, 2),
('Buzo Bali', 'buzos', 15000, '9/10', E'68 cm de largo · 62 cm de ancho.\nLe faltan 2 botones.', array['assets/products/buzo-bali.jpg'], false, 3),
('Campera Broncos', 'camperas', 55000, '10/10', '72 cm de largo · 61 cm de ancho.', array['assets/products/campera-broncos.jpg'], true, 4),
('Pantalón Eddie Bauer', 'pantalones', 40000, '10/10', '108 cm de largo · 49 cm de cintura.', array['assets/products/pantalon-eddie-bauer.jpg'], false, 5),
('Gorra Realtree Mossy Oak', 'gorras', 35000, '10/10', 'Regulable con abrojo velcro.', array['assets/products/gorra-mossy-oak.jpg'], false, 6),
('Buzo Altamont Apparel', 'buzos', 20000, '7/10', E'71 cm de largo · 54 cm de ancho.\nDetalles en las últimas fotos.', array['assets/products/buzo-altamont.jpg'], false, 7),
('Pantalón Recto Longboard', 'pantalones', 30000, '10/10', '108 cm de largo · 39 cm de cintura.', array['assets/products/pantalon-longboard.jpg'], false, 8),
('Buzo John L Cook', 'buzos', 20000, '8/10', E'76 cm de largo · 54 cm de ancho.\nDetalle en tercer foto.', array['assets/products/buzo-john-l-cook.jpg'], false, 9),
('Chomba de Golf NikeFIT', 'remeras', 30000, '10/10', '69 cm de largo · 53 cm de ancho.', array['assets/products/chomba-nikefit.jpg'], false, 10);
