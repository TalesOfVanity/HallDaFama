-- Tales of Vanity — separação entre feitos de personagem e feitos diretos do player/narrador
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS source_scope text NOT NULL DEFAULT 'player';
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_source_scope_check;
ALTER TABLE public.badges ADD CONSTRAINT badges_source_scope_check CHECK (source_scope IN ('character','player'));

CREATE TABLE IF NOT EXISTS public.character_badge_progress (
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  progress_value integer NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, badge_id)
);
ALTER TABLE public.character_badge_progress ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.character_badge_progress TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.character_badge_progress TO authenticated;
DROP POLICY IF EXISTS "character_badge_progress_public_read" ON public.character_badge_progress;
CREATE POLICY "character_badge_progress_public_read" ON public.character_badge_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "character_badge_progress_admin_manage" ON public.character_badge_progress;
CREATE POLICY "character_badge_progress_admin_manage" ON public.character_badge_progress FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Feitos que são somados entre todos os personagens do player
UPDATE public.badges SET source_scope='character' WHERE name IN (
 'Arcanista','Beligerante','Trickster','Bastião','Olho de Águia','Caçador de Monstros',
 'Cronista','Renome','Andarilho','Fortuna','Companheiro de Jornada','Carrasco','Sobrevivente','Especialista'
);
-- Feitos diretamente ligados ao jogador/narrador
UPDATE public.badges SET source_scope='player' WHERE name IN ('Em Chamas','Contador de Histórias','Worldbuilder','Veterano','MVP');

-- Evita manter uma atribuição manual de player para conquistas que agora são derivadas dos personagens.
DELETE FROM public.player_badges pb USING public.badges b WHERE pb.badge_id=b.id AND b.source_scope='character';
