-- =========================================================================
-- Migration 09: Seed Admin User in Supabase
-- Creates and confirms admin@ghoomo.com and grants admin role
-- Also promotes rarnab225@gmail.com to admin
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_email text := 'admin@ghoomo.com';
  v_admin_pass text := 'AdminPassword123!';
  v_user_id uuid;
BEGIN
  -- 1. Check if admin user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user: confirm email, set password and admin metadata
    UPDATE auth.users
    SET 
      encrypted_password = crypt(v_admin_pass, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"full_name":"Ghoomo Administrator","role":"admin"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;
  ELSE
    -- Generate new user id and insert into auth.users with confirmed email
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_admin_email,
      crypt(v_admin_pass, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ghoomo Administrator","role":"admin"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 2. Upsert admin profile in public.profiles
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    v_user_id,
    v_admin_email,
    'Ghoomo Administrator',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Ghoomo Administrator';

  -- 3. Also promote developer/owner account if exists
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email IN ('rarnab225@gmail.com');

END $$;
