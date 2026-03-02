
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItems() {
    console.log('Checking Items (limit 5)...');
    const { data: items, error } = await supabase
        .from('items')
        .select('name, cart_location, warehouse_location')
        .limit(5);

    if (error) {
        console.error('Error fetching items:', error);
    } else {
        console.table(items);
    }

    console.log('\nChecking if cart_items table exists...');
    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .limit(5);

    if (cartError) {
        console.log('cart_items table likely does not exist or error:', cartError.message);
    } else {
        console.log('cart_items exists. Record count:', cartItems.length);
        console.table(cartItems);
    }
}

checkItems();
