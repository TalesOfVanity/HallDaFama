-- Tales of Vanity — Brasões progressivos + MVP
-- Execute este bloco inteiro no SQL Editor do Supabase.

ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS progression_mode text NOT NULL DEFAULT 'quantitative',
  ADD COLUMN IF NOT EXISTS exp_multiplier numeric(6,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_mvp boolean NOT NULL DEFAULT false;

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_progression_mode_check;
ALTER TABLE public.badges
  ADD CONSTRAINT badges_progression_mode_check
  CHECK (progression_mode IN ('quantitative','qualitative','special'));

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_exp_multiplier_check;
ALTER TABLE public.badges
  ADD CONSTRAINT badges_exp_multiplier_check
  CHECK (exp_multiplier >= 0);

ALTER TABLE public.player_badges
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'leather',
  ADD COLUMN IF NOT EXISTS progress_value integer NOT NULL DEFAULT 0;

ALTER TABLE public.player_badges
  DROP CONSTRAINT IF EXISTS player_badges_rarity_check;
ALTER TABLE public.player_badges
  ADD CONSTRAINT player_badges_rarity_check
  CHECK (rarity IN ('leather','copper','iron','bronze','silver','gold','platinum','emerald','diamond','obsidian','special'));

ALTER TABLE public.player_badges
  DROP CONSTRAINT IF EXISTS player_badges_progress_value_check;
ALTER TABLE public.player_badges
  ADD CONSTRAINT player_badges_progress_value_check
  CHECK (progress_value >= 0);

-- Só pode existir uma definição de Brasão MVP no catálogo.
CREATE UNIQUE INDEX IF NOT EXISTS badges_single_mvp_definition
  ON public.badges ((is_mvp))
  WHERE is_mvp = true;

-- Ao conceder o MVP, remove automaticamente a concessão do detentor anterior.
CREATE OR REPLACE FUNCTION public.ensure_single_mvp_holder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_is_mvp boolean;
BEGIN
  SELECT is_mvp INTO target_is_mvp
  FROM public.badges
  WHERE id = NEW.badge_id;

  IF coalesce(target_is_mvp, false) THEN
    DELETE FROM public.player_badges pb
    USING public.badges b
    WHERE pb.badge_id = b.id
      AND b.is_mvp = true
      AND pb.player_id <> NEW.player_id;

    NEW.rarity := 'special';
    NEW.progress_value := 0;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS player_badges_single_mvp ON public.player_badges;
CREATE TRIGGER player_badges_single_mvp
BEFORE INSERT OR UPDATE OF player_id, badge_id
ON public.player_badges
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_mvp_holder();

-- Permissões necessárias para o site público e para a administração autenticada.
GRANT SELECT ON TABLE public.badges TO anon, authenticated;
GRANT SELECT ON TABLE public.player_badges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.badges TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.player_badges TO authenticated;

DROP POLICY IF EXISTS "badges_public_read" ON public.badges;
CREATE POLICY "badges_public_read"
ON public.badges FOR SELECT
USING (true);

DROP POLICY IF EXISTS "player_badges_public_read" ON public.player_badges;
CREATE POLICY "player_badges_public_read"
ON public.player_badges FOR SELECT
USING (true);

DROP POLICY IF EXISTS "admin_manage_badges" ON public.badges;
CREATE POLICY "admin_manage_badges"
ON public.badges FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_player_badges" ON public.player_badges;
CREATE POLICY "admin_manage_player_badges"
ON public.player_badges FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- EXP usada pelo front-end por raridade:
-- Couro 5 | Cobre 10 | Ferro 15 | Bronze 25 | Prata 40
-- Ouro 60 | Platina 90 | Esmeralda 130 | Diamante 180 | Obsidiana 250
-- exp_multiplier permite valorizar linhas específicas; ex.: Narrador = 2.
-- MVP sempre vale 0 EXP e fica fora da progressão tradicional.
