const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://mcaynnjedzcdmdewjcnr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXlubmplZHpjZG1kZXdqY25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE4NTk2OSwiZXhwIjoyMDk1NzYxOTY5fQ.FYZQUQqdhrc3xCLLAbYZhxK_6ek4hP30QBGTRwcvOFI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
supabase.from('telegram_users').select('*').then(res => {
    console.log(res);
});
