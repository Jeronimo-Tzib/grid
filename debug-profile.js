const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProfile() {
  try {
    console.log('🔍 Debugging user profile...')
    
    // Get all profiles to see what exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }
    
    console.log('\n📋 All profiles in database:')
    profiles.forEach(profile => {
      console.log(`   ID: ${profile.id}`)
      console.log(`   Email: ${profile.email}`)
      console.log(`   Role: "${profile.role}" (type: ${typeof profile.role})`)
      console.log(`   Name: ${profile.full_name || 'N/A'}`)
      console.log('   ---')
    })
    
    // Check if admin role exists
    const adminProfiles = profiles?.filter(p => p.role === 'admin') || []
    console.log(`\n👑 Admin profiles found: ${adminProfiles.length}`)
    
    if (adminProfiles.length === 0) {
      console.log('\n⚠️  No admin profiles found. You may need to update your role in the database.')
      console.log('To update your role to admin, run:')
      console.log(`UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';`)
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugProfile()
