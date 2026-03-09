-- Fix RLS policies to avoid infinite recursion
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Doctors can view mother profiles" ON mother_profiles;
DROP POLICY IF EXISTS "Mothers can view their assigned doctors" ON doctor_profiles;

-- Recreate with SECURITY DEFINER functions to avoid recursion

-- Create helper function to check if user is a doctor
CREATE OR REPLACE FUNCTION is_doctor(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM doctor_profiles WHERE user_id = user_uuid
  );
$$;

-- Create helper function to check if user is a mother
CREATE OR REPLACE FUNCTION is_mother(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mother_profiles WHERE user_id = user_uuid
  );
$$;

-- Recreate doctor viewing mother profiles policy using the helper function
CREATE POLICY "Doctors can view mother profiles"
  ON mother_profiles FOR SELECT
  TO authenticated
  USING (is_doctor(auth.uid()));

-- Recreate mothers viewing assigned doctors policy
CREATE POLICY "Mothers can view their assigned doctors"
  ON doctor_profiles FOR SELECT
  TO authenticated
  USING (
    is_mother(auth.uid()) AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN mother_profiles m ON m.id = a.mother_id
      WHERE m.user_id = auth.uid() AND a.doctor_id = doctor_profiles.id
    )
  );

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION is_doctor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_mother(uuid) TO authenticated;
