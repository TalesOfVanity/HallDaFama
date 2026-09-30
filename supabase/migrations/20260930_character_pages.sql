-- Tales of Vanity — páginas de personagem e conteúdo estruturado

CREATE TABLE IF NOT EXISTS public.character_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('skills', 'inventory', 'history')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  content text CHECK (content IS NULL OR char_length(content) <= 100000),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS character_content_character_category_idx
ON public.character_content(character_id, category, position);

ALTER TABLE public.character_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.character_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.character_content TO authenticated;

DROP POLICY IF EXISTS "character_content_public_read" ON public.character_content;
CREATE POLICY "character_content_public_read"
ON public.character_content FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id AND c.status = 'approved'
  )
);

DROP POLICY IF EXISTS "character_content_owner_admin_insert" ON public.character_content;
CREATE POLICY "character_content_owner_admin_insert"
ON public.character_content FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id
      AND (c.owner_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "character_content_owner_admin_update" ON public.character_content;
CREATE POLICY "character_content_owner_admin_update"
ON public.character_content FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id
      AND (c.owner_id = auth.uid() OR public.is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id
      AND (c.owner_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "character_content_owner_admin_delete" ON public.character_content;
CREATE POLICY "character_content_owner_admin_delete"
ON public.character_content FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id
      AND (c.owner_id = auth.uid() OR public.is_admin())
  )
);

-- Publicações do perfil passam a ser sempre simples.
UPDATE public.profile_posts SET is_structured = false WHERE is_structured = true;

-- Garante que o autor continue podendo editar suas próprias publicações/mensagens.
GRANT UPDATE ON public.profile_posts TO authenticated;
DROP POLICY IF EXISTS "profile_posts_author_update" ON public.profile_posts;
CREATE POLICY "profile_posts_author_update"
ON public.profile_posts FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (
  author_id = auth.uid()
  AND (
    (post_type = 'personal' AND profile_id = auth.uid())
    OR post_type = 'wall'
  )
);
