
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLocations() {
    const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .order('parent_id', { nullsFirst: true })
        .order('name');

    if (error) {
        console.error("Error fetching locations:", error);
        return;
    }

    console.log(`Found ${locations.length} locations.`);

    const roots = locations.filter(l => !l.parent_id);
    roots.forEach(root => {
        console.log(`[ROOT] ${root.name} (ID: ${root.id}, Type: ${root.type})`);
        const children = locations.filter(l => l.parent_id === root.id);
        if (children.length === 0) {
            console.log(`   -> No sub-locations found.`);
        } else {
            children.forEach(child => {
                console.log(`   -> [CHILD] ${child.name} (ID: ${child.id})`);
            });
        }
    });

    // Check for orphans
    const orphans = locations.filter(l => l.parent_id && !locations.find(p => p.id === l.parent_id));
    if (orphans.length > 0) {
        console.log("\nORPHAN LOCATIONS (Parent ID not found in list):");
        orphans.forEach(o => console.log(`- ${o.name} (Parent: ${o.parent_id})`));
    }
}

inspectLocations();
