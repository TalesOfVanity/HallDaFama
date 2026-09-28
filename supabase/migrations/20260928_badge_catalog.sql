-- Tales of Vanity — Catálogo inicial de Brasões
-- Execute DEPOIS de 20260928_progressive_badges.sql.
-- Pode ser executado novamente: atualiza Brasões com o mesmo nome e cria os ausentes.

ALTER TABLE public.badges
  ADD COLUMN IF NOT EXISTS progression_steps jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TEMP TABLE tov_badge_seed (
  name text,
  description text,
  icon text,
  category text,
  progression_mode text,
  exp_multiplier numeric(6,2),
  is_mvp boolean,
  progression_steps jsonb
) ON COMMIT DROP;

INSERT INTO tov_badge_seed VALUES
('Arcanista', 'Finalize inimigos utilizando skills classificadas como Mágicas.', 'assets/badges/noun_WitchHat_5305828_@700(1).png', 'Intérprete · Combate Mágico', 'quantitative', 1, false, '[1,5,10,25,50,100,175,250,350,500]'),
('Beligerante', 'Finalize inimigos utilizando skills classificadas como Físicas.', 'assets/badges/noun_Swords_5305825_@700(1).png', 'Intérprete · Combate Físico', 'quantitative', 1, false, '[1,5,10,25,50,100,175,250,350,500]'),
('Trickster', 'Realize Ações Ocultas com sucesso. Contam artifícios de enganação, manipulação, distração, blefe, furtividade, trapaça ou abordagens imprevisíveis que produzam resultado efetivo na cena.', 'assets/badges/noun_magic_5305780_@700(1).png', 'Ambos · Astúcia', 'quantitative', 1, false, '[1,5,10,25,50,100,175,250,350,500]'),
('Bastião', 'Proteja outro personagem de uma ofensiva que o atingiria, impedindo ou reduzindo efetivamente o ataque recebido.', 'assets/badges/noun_warshield_5305827_@700(1).png', 'Intérprete · Defesa', 'quantitative', 1, false, '[1,5,10,20,35,50,75,100,150,250]'),
('Olho de Águia', 'Acerte ataques realizados a longa distância, independentemente de serem físicos, mágicos ou de outra natureza permitida pelo sistema.', 'assets/badges/noun_Target_5305811_@700.png', 'Intérprete · Precisão', 'quantitative', 1, false, '[1,10,25,50,100,175,250,400,650,1000]'),
('Caçador de Monstros', 'Participe da derrota de criaturas oficialmente classificadas como Boss.', 'assets/badges/noun_Beast_5305832_@700(1).png', 'Intérprete · PvE', 'quantitative', 1, false, '[1,2,3,5,10,15,25,35,50,75]'),
('Em Chamas', 'Participe ativamente do RPG em dias diferentes. Os dias não precisam ser consecutivos.', 'assets/badges/noun_Fire_5305823_@700(1).png', 'Ambos · Atividade', 'quantitative', 1, false, '[3,7,15,30,60,100,150,225,300,500]'),
('Cronista', 'Conclua missões, capítulos ou aventuras oficiais de Tales of Vanity.', 'assets/badges/cronista-map.png', 'Intérprete · Narrativa', 'quantitative', 1, false, '[1,3,5,10,20,30,50,75,100,150]'),
('Contador de Histórias', 'Conclua narrações oficiais para outros jogadores, conduzindo cenas, missões, acontecimentos ou conteúdos que contribuam para o desenvolvimento de seus personagens.', 'assets/badges/noun_quillpen_5305775_@700(1).png', 'Narrador · Narração', 'quantitative', 2, false, '[1,3,5,10,20,35,50,75,100,150]'),
('Worldbuilder', 'Reconhecimento pela qualidade dos turnos: imersão, domínio técnico, riqueza de detalhes, ambientação, coerência narrativa e cuidado na construção das cenas.', 'assets/badges/worldbuilder-scroll.png', 'Ambos · Qualidade Narrativa', 'qualitative', 1, false, '[]'),
('Renome', 'Acumule títulos e reconhecimentos oficiais concedidos ao personagem dentro do RPG.', 'assets/badges/noun_King_5305786_@700(1).png', 'Intérprete · Prestígio', 'quantitative', 1, false, '[1,2,3,5,7,10,15,20,30,50]'),
('Andarilho', 'Descubra áreas novas durante suas aventuras, revelando localidades até então desconhecidas dentro do RPG.', 'assets/badges/noun_Horse_5305784_@700(1).png', 'Intérprete · Exploração', 'quantitative', 1, false, '[1,2,3,5,8,12,18,25,35,50]'),
('Fortuna', 'Acumule patrimônio ou moeda oficial do RPG. Os marcos desta conquista serão calibrados de acordo com a economia de Tales of Vanity.', 'assets/badges/noun_Money_5305842_@700(1).png', 'Intérprete · Economia', 'quantitative', 1, false, '[]'),
('Companheiro de Jornada', 'Compartilhe cenas e aventuras com personagens diferentes. Personagens de jogadores, NPCs oficiais e Companions contam; cada indivíduo é contabilizado apenas uma vez.', 'assets/badges/noun_woodenmug_5305804_@700.png', 'Ambos · Social', 'quantitative', 1, false, '[2,5,10,15,25,35,50,75,100,150]'),
('Veterano', 'Permaneça participando de Tales of Vanity ao longo do tempo. A progressão representa a longevidade do jogador no RPG.', 'assets/badges/noun_modernhut_5305838_@700.png', 'Ambos · Longevidade', 'quantitative', 1, false, '[7,30,90,180,365,548,730,1095,1460,1825]'),
('Carrasco', 'Finalize inimigos por qualquer método válido dentro do sistema.', 'assets/badges/noun_excalibur_5305796_@700(1).png', 'Intérprete · Combate', 'quantitative', 1, false, '[1,10,25,50,100,200,350,500,750,1000]'),
('Sobrevivente', 'Sobreviva a situações oficialmente reconhecidas como risco de morte.', 'assets/badges/noun_magicpendent_5303332_@700(1).png', 'Intérprete · Sobrevivência', 'quantitative', 1, false, '[1,2,3,5,10,15,25,35,50,75]'),
('Especialista', 'Maximize skills dentro do sistema, levando capacidades do personagem ao limite máximo de desenvolvimento disponível.', 'assets/badges/noun_Crown_5305817_@700.png', 'Intérprete · Progressão', 'quantitative', 1, false, '[1,2,3,5,8,12,18,25,35,50]'),
('MVP', 'Distinção temporária concedida ao jogador de maior destaque do período atual de Tales of Vanity. Não concede EXP e coloca o detentor no topo do Hall da Fama enquanto estiver ativa.', 'assets/badges/noun_dragon_5305836_@700(1).png', 'Especial · MVP', 'special', 0, true, '[]');

UPDATE public.badges b
SET description = s.description,
    icon = s.icon,
    category = s.category,
    progression_mode = s.progression_mode,
    exp_multiplier = s.exp_multiplier,
    is_mvp = s.is_mvp,
    progression_steps = s.progression_steps
FROM tov_badge_seed s
WHERE lower(b.name) = lower(s.name);

INSERT INTO public.badges (name, description, icon, category, progression_mode, exp_multiplier, is_mvp, progression_steps)
SELECT s.name, s.description, s.icon, s.category, s.progression_mode, s.exp_multiplier, s.is_mvp, s.progression_steps
FROM tov_badge_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges b WHERE lower(b.name) = lower(s.name)
);
