-- Precaución: Esta operación es irreversible.
-- Asegúrate de que la migración a 'cart_contents' ha sido verificada correctamente antes de ejecutar esto.

DROP TABLE IF EXISTS cart_cures_items;
DROP TABLE IF EXISTS cart_crash_items;
DROP TABLE IF EXISTS cart_techniques_items;

-- Opcional: Si existían triggers o funciones asociadas a estas tablas, también deberían eliminarse.
-- (Asumiendo que no había lógicas complejas de triggers exclusivas de estas tablas que no se necesiten)
