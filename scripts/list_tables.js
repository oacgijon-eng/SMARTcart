
const projectRef = process.argv[2];
const token = process.argv[3];

if (!projectRef || !token) {
    console.error("Usage: node list_tables.js <projectRef> <token>");
    process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const query = {
    query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
};

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
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error("Error:", err.message);
        process.exit(1);
    });
