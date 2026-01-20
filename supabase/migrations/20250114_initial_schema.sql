-- Enable UUID extension if needed (though we use text IDs from mock data for now, switching to UUIDs is better, but let's keep consistency with mock data first)

-- Create Enum for LocationType
CREATE TYPE location_type AS ENUM ('CART', 'EXTERNAL');

-- Create Items Table
CREATE TABLE items (
  id text PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  category text,
  location_type location_type NOT NULL,
  cart_location text,
  warehouse_location text,
  stock_ideal integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Techniques Table
CREATE TABLE techniques (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  description text,
  protocol_url text,
  icon_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Technique Items Junction Table
CREATE TABLE technique_items (
  technique_id text REFERENCES techniques(id) ON DELETE CASCADE,
  item_id text REFERENCES items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  PRIMARY KEY (technique_id, item_id)
);

-- ROW LEVEL SECURITY (RLS)
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE technique_items ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read, Authenticated Write - or Public Write for demo simplicity if needed, but 'Authenticated' is safer. For this demo, let's allow public read/write to avoid auth friction unless requested)
-- Actually, let's just allow ALL for anon for this prototype phase.
CREATE POLICY "Allow all access to items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to techniques" ON techniques FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to technique_items" ON technique_items FOR ALL USING (true) WITH CHECK (true);

-- SEED DATA (From constants.ts)
INSERT INTO items (id, name, image_url, category, location_type, cart_location, warehouse_location, stock_ideal) VALUES
('i1', 'Guantes Estériles 7.5', 'https://picsum.photos/100/100?random=1', 'Protección', 'CART', 'Cajón 1 (Superior)', 'Almacén A - Estante 2', 50),
('i2', 'Catéter Venoso 20G', 'https://picsum.photos/100/100?random=2', 'Vías', 'CART', 'Cajón 2', 'Almacén B - Estante 1', 20),
('i3', 'Apósito Transparente', 'https://picsum.photos/100/100?random=3', 'Curas', 'CART', 'Cajón 2', 'Almacén A - Estante 3', 30),
('i4', 'Clorhexidina 2%', 'https://picsum.photos/100/100?random=4', 'Desinfección', 'CART', 'Botellero Lateral', 'Almacén Farmacia', 5),
('i5', 'Morfina 10mg (Estupefaciente)', 'https://picsum.photos/100/100?random=5', 'Fármacos', 'EXTERNAL', 'NO EN CARRO', 'Farmacia (Requiere Llave)', 0),
('i6', 'Sonda Foley 16Fr', 'https://picsum.photos/100/100?random=6', 'Urología', 'CART', 'Cajón 3', 'Almacén B - Estante 4', 10),
('i7', 'Bolsa Colectora Orina', 'https://picsum.photos/100/100?random=7', 'Urología', 'CART', 'Cajón 3', 'Almacén B - Estante 5', 10);

INSERT INTO techniques (id, name, category, description, protocol_url, icon_name) VALUES
('t1', 'Canalización Vía Periférica', 'Accesos Vasculares', 'Protocolo estándar para inserción de catéter venoso periférico.', '#', 'Activity'),
('t2', 'Sondaje Vesical Masculino', 'Urología', 'Inserción de sonda urinaria permanente.', '#', 'Droplet'),
('t3', 'Drenaje Pericárdico', 'Cardiología', 'Técnica de urgencia para pericardiocentesis.', '#', 'HeartPulse');

INSERT INTO technique_items (technique_id, item_id, quantity) VALUES
('t1', 'i1', 1),
('t1', 'i2', 1),
('t1', 'i3', 1),
('t1', 'i4', 1),
('t2', 'i1', 2),
('t2', 'i6', 1),
('t2', 'i7', 1),
('t2', 'i4', 1),
('t3', 'i1', 2),
('t3', 'i2', 1),
('t3', 'i3', 1),
('t3', 'i4', 1);
