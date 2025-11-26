-- Script to update a user's role to admin
-- Replace 'your-email@example.com' with your actual email

-- First, check your current profile
SELECT * FROM profiles WHERE email = 'your-email@example.com';

-- Update your role to admin (uncomment and run after replacing email)
-- UPDATE profiles 
-- SET role = 'admin', updated_at = NOW() 
-- WHERE email = 'your-email@example.com';

-- Verify the update
-- SELECT * FROM profiles WHERE email = 'your-email@example.com';

-- Alternative: Update by user ID if you know it
-- UPDATE profiles 
-- SET role = 'admin', updated_at = NOW() 
-- WHERE id = 'your-user-id-here';

-- List all users to help identify your account
SELECT id, email, role, full_name, created_at FROM profiles ORDER BY created_at DESC;
