# Wisa Tovova — Plataforma de sugestões

Website responsivo para recolher sugestões de temas para debates do Club Jovem, com participação anónima opcional e painel privado de gestão.

## O que inclui
- Página pública de apresentação do Wisa Tovova.
- Formulário de sugestões com categoria, título e contexto.
- Envio anónimo por defeito; opção de identificação com nome e email opcional.
- Painel privado com autenticação Supabase.
- Estados de moderação: em análise, aprovado, escolhido para debate e não seleccionado.
- Votação em propostas publicadas.
- Layout adaptado a telemóveis, tablets e computadores.

## Importante: ligar a base de dados
O projecto vem preparado para Supabase. Para receber sugestões reais e proteger a área administrativa, é necessário configurar um projecto Supabase.

1. Crie um projecto em https://supabase.com/.
2. Abra o SQL Editor e execute todo o ficheiro `supabase/schema.sql`.
3. Em Project Settings > API, copie Project URL e a chave `anon`/publishable.
4. Copie `.env.example` para `.env` e preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Em Authentication, crie o utilizador da equipa (email e palavra-passe).
6. Copie o UUID do utilizador criado e execute no SQL Editor:
   `insert into public.admins (user_id) values ('UUID-DO-UTILIZADOR');`
7. Instale dependências e execute:
   `npm install`
   `npm run dev`
8. Para produção:
   `npm run build`
   Publique a pasta `dist` num serviço como Vercel ou Netlify.

## QR Code e link público
Depois de publicar, use o URL público do website para gerar um QR Code. O QR Code deve apontar para a página inicial ou directamente para `https://o-seu-dominio/#sugerir` (pode também divulgar o link da página e o botão “Sugerir um tema”).

## Segurança e privacidade
- A área administrativa exige autenticação Supabase e o utilizador tem de constar na tabela `admins`.
- As políticas RLS impedem o público de consultar sugestões pendentes ou rejeitadas.
- A participação anónima não guarda nome nem email.
- A chave `service_role` nunca deve ser colocada no frontend.
- A votação usa um identificador guardado no navegador e uma restrição única na base de dados. Isto reduz votos repetidos no mesmo dispositivo, mas não é uma garantia anti-fraude forte; para votação oficial, implementar autenticação/limites anti-abuso adicionais.
- Antes do lançamento, publicar uma política de privacidade e definir quem na equipa pode aceder aos dados de identificação.

## Personalização
As cores principais estão no ficheiro `src/styles.css` e seguem a identidade azul, preto e branco do Wisa Tovova. O nome, assinatura e rubricas podem ser ajustados em `src/main.jsx`.

## Estado actual
Este é um projecto de aplicação pronto para configuração e publicação, não um website já alojado na internet. Para funcionar com submissões reais, precisa das credenciais do Supabase e de publicação num domínio/serviço de hosting.
