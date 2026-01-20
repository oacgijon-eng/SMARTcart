
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateTechnique() {
    console.log('Testing createTechnique with items...');

    try {
        // 0. Get an item ID
        const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('id')
            .limit(1)
            .single();

        if (itemsError || !itemsData) {
            console.error('Error fetching item:', itemsError);
            return;
        }

        const itemId = itemsData.id;
        console.log('Using item ID:', itemId);


        const technique = {
            name: 'Test Tech Items ' + Date.now(),
            description: 'Test Description Items',
            protocolUrl: null,
            items: [{ itemId: itemId, quantity: 2 }]
        };

        // 1. Create Technique
        const { data: techData, error: techError } = await supabase
            .from('techniques')
            .insert([{
                id: crypto.randomUUID(),
                name: technique.name,
                description: technique.description,
                protocol_url: technique.protocolUrl || null,
                category: 'General',
                icon_name: 'FileText'
            }])
            .select()
            .single();

        if (techError) {
            console.error('Error creating technique (step 1):', techError);
            return;
        }

        console.log('Technique created:', techData.id);

        // 2. Create Technique Items
        if (technique.items.length > 0) {
            const techniqueItems = technique.items.map(item => ({
                technique_id: techData.id,
                item_id: item.itemId,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('technique_items')
                .insert(techniqueItems);

            if (itemsError) {
                console.error('Error creating technique items (step 2):', itemsItems); // Typo intentional to catch? No.
                console.error('Error details:', itemsError);
                throw itemsError;
            }
        }

        console.log('Technique and items created successfully');

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

testCreateTechnique();
