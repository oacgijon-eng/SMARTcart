
const projectRef = process.argv[2];
const token = process.argv[3];

if (!projectRef || !token) {
    console.error("Usage: node delete_tables.js <projectRef> <token>");
    process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

// Using CASCADE to handle any foreign key constraints between these legacy tables
const tablesToDelete = [
    'Materiales',
    'Tecnicas',
    'Incidencias',
    'Kits',
    'Ubicaciones',
    'Tipos_ubicacion',
    'Inventario'
];

const sql = tablesToDelete.map(t => `DROP TABLE IF EXISTS "${t}" CASCADE;`).join('\n');

const query = {
    query: sql
};

console.log("Executing SQL:\n", sql);

fetch(url, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
})
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => { throw new Error(`HTTP ${res.status}: ${text}`) });
        }
        return res.json();
    })
    .then(data => {
        console.log("Deletion successful. Response:", JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error("Error:", err.message);
        process.exit(1);
    });
