-- Debug script to check residents table
-- Run this in Supabase SQL editor to check the residents table

-- 1. Check if residents table has data
SELECT 'Residents count:' as check_type, count(*) as result FROM public.residents;

-- 2. Check all residents
SELECT 'All residents:' as check_type, id, full_name, is_active FROM public.residents;

-- 3. Check active residents only
SELECT 'Active residents:' as check_type, id, full_name FROM public.residents WHERE is_active = true;

-- 4. Check RLS policies on residents table
SELECT 'RLS enabled:' as check_type, 
       CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as result
FROM pg_class 
WHERE relname = 'residents' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Check existing policies
SELECT 'Policies:' as check_type, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'residents' AND schemaname = 'public';

-- 6. Test if current user can select from residents (this should work if policies are correct)
SELECT 'Can select test:' as check_type, 
       CASE WHEN EXISTS(SELECT 1 FROM public.residents LIMIT 1) THEN 'YES' ELSE 'NO' END as result;
