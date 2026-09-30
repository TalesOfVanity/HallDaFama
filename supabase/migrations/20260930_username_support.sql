-- Suporte a @username no cadastro e edição de perfil
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci
ON public.profiles (lower(username))
WHERE username IS NOT NULL;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, username, avatar_url, country, bio, participation_type)
ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, country, participation_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Jogador'),
    NULLIF(lower(NEW.raw_user_meta_data ->> 'username'), ''),
    NEW.raw_user_meta_data ->> 'country',
    COALESCE(NEW.raw_user_meta_data ->> 'participation_type', 'interpreter')
  );
  RETURN NEW;
END;
$$;
