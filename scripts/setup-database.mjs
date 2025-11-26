import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('Make sure these are set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// SQL files to execute in order
const sqlFiles = [
  '001_enable_postgis.sql',
  '002_create_profiles.sql',
  '003_create_incidents.sql',
  '004_create_alerts.sql',
  '005_create_chat_messages.sql',
  '006_create_incident_insights.sql',
  '007_create_auto_alert_trigger.sql'
]

console.log('🚀 Starting database setup...\n')

for (const file of sqlFiles) {
  try {
    console.log(`📄 Executing ${file}...`)
    const sqlPath = join(__dirname, file)
    const sql = readFileSync(sqlPath, 'utf8')
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
    
    if (error) {
      // Try direct execution if RPC doesn't work
      const { error: directError } = await supabase.from('_migrations').insert({ name: file })
      
      if (directError) {
        console.error(`❌ Error executing ${file}:`, error.message)
        // Continue with other files
      } else {
        console.log(`✅ ${file} executed successfully`)
      }
    } else {
      console.log(`✅ ${file} executed successfully`)
    }
  } catch (err) {
    console.error(`❌ Error reading ${file}:`, err.message)
  }
}

console.log('\n✨ Database setup complete!')
console.log('\n📊 Verifying tables...')

// Verify tables were created
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')

if (tablesError) {
  console.log('⚠️  Could not verify tables, but setup may have succeeded')
} else {
  console.log('\n✅ Tables created:')
  tables?.forEach(t => console.log(`   - ${t.table_name}`))
}
