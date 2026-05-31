const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mcaynnjedzcdmdewjcnr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXlubmplZHpjZG1kZXdqY25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE4NTk2OSwiZXhwIjoyMDk1NzYxOTY5fQ.FYZQUQqdhrc3xCLLAbYZhxK_6ek4hP30QBGTRwcvOFI');
supabase.from('telegram_users').select('*').then(res => {
    console.log(res.error ? 'Error: ' + res.error.message : 'Loaded ' + res.data.length);
    process.exit();
});
