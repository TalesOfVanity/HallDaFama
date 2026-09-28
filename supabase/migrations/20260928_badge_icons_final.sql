-- Tales of Vanity — associação final dos ícones de Brasões
-- Pode ser executado após o catálogo inicial.

UPDATE public.badges
SET icon = 'assets/badges/worldbuilder-scroll.png'
WHERE lower(name) = lower('Worldbuilder');

UPDATE public.badges
SET icon = 'assets/badges/cronista-map.png'
WHERE lower(name) = lower('Cronista');

UPDATE public.badges
SET icon = 'assets/badges/noun_Crown_5305817_@700.png'
WHERE lower(name) = lower('Especialista');

UPDATE public.badges
SET icon = 'assets/badges/noun_excalibur_5305796_@700(1).png'
WHERE lower(name) = lower('Carrasco');

UPDATE public.badges
SET icon = 'assets/badges/noun_dragon_5305836_@700(1).png'
WHERE lower(name) = lower('MVP');
