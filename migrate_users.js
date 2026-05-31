const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://mcaynnjedzcdmdewjcnr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXlubmplZHpjZG1kZXdqY25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE4NTk2OSwiZXhwIjoyMDk1NzYxOTY5fQ.FYZQUQqdhrc3xCLLAbYZhxK_6ek4hP30QBGTRwcvOFI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    if (fs.existsSync('./users.json')) {
        const data = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
        let rows = [];
        if (data.adminId) {
            rows.push({ chat_id: data.adminId, expiry: 0, active_server_mode: 'ALL', is_admin: true });
        }
        for (let [uid, udata] of Object.entries(data.users)) {
            rows.push({ chat_id: uid, expiry: udata.expiry, active_server_mode: udata.activeServerMode || 'ALL', is_admin: false });
        }
        if (rows.length > 0) {
            const { error } = await supabase.from('telegram_users').upsert(rows);
            if (error) console.error('Error migrating users:', error);
            else console.log('Successfully migrated ' + rows.length + ' users to Supabase!');
        } else {
            console.log('No users to migrate.');
        }
    }
}
run();
