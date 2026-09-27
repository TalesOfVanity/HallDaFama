# RPG Website — GitHub Pages + Supabase

Estrutura inicial de um portal de RPG com:
- GitHub Pages para hospedagem do frontend
- Supabase para autenticação, PostgreSQL e Storage
- JavaScript puro, sem framework
- Perfis de jogadores/personagens
- Ranking inicial
- Badges/insígnias
- Clãs

## 1. Supabase

1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Em Authentication > URL Configuration, adicione a URL do GitHub Pages:
   `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`
5. Copie a Project URL e a anon/public key.

## 2. Configuração

Edite:

`js/config.example.js`

e salve como:

`js/config.js`

Preencha:
- SUPABASE_URL
- SUPABASE_ANON_KEY

A anon key pode ficar no frontend. Nunca coloque uma service_role key no repositório.

## 3. GitHub Pages

Suba todos os arquivos para um repositório.

Em:
Settings > Pages

selecione:
- Deploy from a branch
- Branch: main
- Folder: / (root)

Depois abra a URL fornecida pelo GitHub.

## 4. Primeiro administrador

O cadastro normal cria um perfil com role `player`.

Para transformar uma conta em administrador, execute no SQL Editor:

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'UUID_DO_USUARIO';

## Estrutura

- `index.html` — página inicial
- `login.html` — login
- `cadastro.html` — cadastro
- `jogadores.html` — listagem
- `jogador.html?id=...` — perfil
- `ranking.html` — ranking
- `clans.html` — clãs
- `admin.html` — painel administrativo
- `regras.html` — regras
- `css/` — estilos
- `js/` — lógica
- `supabase/schema.sql` — banco e políticas
- `assets/` — imagens e ícones
