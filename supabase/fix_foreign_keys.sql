-- Fix foreign key constraint on mother_profiles to reference auth.users
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Drop the existing foreign key constraint
ALTER TABLE mother_profiles 
DROP CONSTRAINT IF EXISTS mother_profiles_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE mother_profiles 
ADD CONSTRAINT mother_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Do the same for doctor_profiles
ALTER TABLE doctor_profiles 
DROP CONSTRAINT IF EXISTS doctor_profiles_user_id_fkey;

ALTER TABLE doctor_profiles 
ADD CONSTRAINT doctor_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- And admin_profiles
ALTER TABLE admin_profiles 
DROP CONSTRAINT IF EXISTS admin_profiles_user_id_fkey;

ALTER TABLE admin_profiles 
ADD CONSTRAINT admin_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
