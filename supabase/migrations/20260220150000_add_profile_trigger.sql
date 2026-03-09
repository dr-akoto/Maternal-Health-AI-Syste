/*
  # Auto-create profiles on user signup
  
  This migration creates a trigger that automatically creates a profile
  when a new user signs up via Supabase Auth.
  
  The user's role is stored in auth.users.raw_user_meta_data.role
*/

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role from user metadata (set during signUp)
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Default to 'mother' if no role specified
  IF user_role IS NULL OR user_role = '' THEN
    user_role := 'mother';
  END IF;
  
  -- Create the appropriate profile based on role
  IF user_role = 'mother' THEN
    INSERT INTO public.mother_profiles (user_id, full_name, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone'
    );
  ELSIF user_role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (user_id, full_name, phone, license_number, specialization)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', 'Not provided'),
      COALESCE(NEW.raw_user_meta_data->>'license_number', 'PENDING-' || substring(NEW.id::text, 1, 8)),
      COALESCE(NEW.raw_user_meta_data->>'specialization', 'General')
    );
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admin_profiles (user_id, full_name, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.mother_profiles TO supabase_auth_admin;
GRANT ALL ON public.doctor_profiles TO supabase_auth_admin;
GRANT ALL ON public.admin_profiles TO supabase_auth_admin;
