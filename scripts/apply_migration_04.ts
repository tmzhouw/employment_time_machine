import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sqlPath = path.join(process.cwd(), 'db', 'migrations', '04_phase_5_security_upgrades.sql');
  const sqlStatements = fs.readFileSync(sqlPath, 'utf8')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${sqlStatements.length} SQL statements to execute.`);

  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    console.log(`Executing statement ${i + 1}...`);
    
    // Use the RPC function created in previous steps for raw SQL
    const { error } = await supabase.rpc('exec_sql', { sql: statement });
    
    if (error) {
      console.error(`Error executing statement ${i + 1}:`, error.message);
      console.error('SQL details:', statement);
      process.exit(1);
    }
  }

  console.log('Migration 04 completed successfully.');
}

runMigration().catch(console.error);
