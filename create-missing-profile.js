const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMissingProfile() {
  const userId = '3b4d3b68-5303-48b3-a4d4-962cfd99ce52'
  
  try {
    console.log('🔍 Checking if profile exists...')
    
    // First, check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (existingProfile) {
      console.log('✅ Profile already exists!')
      console.log('Profile data:', JSON.stringify(existingProfile, null, 2))
      return
    }
    
    console.log('Profile check error:', checkError)
    
    // Get user info from auth.users
    console.log('🔍 Getting user info from auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('❌ User not found in auth system:', authError)
      return
    }
    
    console.log('User found in auth:', {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at
    })
    
    // Create the missing profile
    console.log('🔧 Creating missing profile...')
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: authUser.user.email,
        full_name: authUser.user.user_metadata?.full_name || null,
        role: 'leader' // Set as leader since you mentioned they have leader privileges
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return
    }
    
    console.log('✅ Profile created successfully!')
    console.log('New profile:', JSON.stringify(newProfile, null, 2))
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createMissingProfile()
