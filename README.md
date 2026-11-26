# Claudia Festas · Catálogo com pedido pelo WhatsApp

Site simples, branco com detalhes laranja, para mostrar produtos e receber pedidos pelo WhatsApp.

- **Loja (`/`)**: menu lateral (categorias, carrinho, WhatsApp), barra de busca (ignora acentos),
  filtros por categoria e lista de produtos com fotos (arraste para o lado, toque para ampliar),
  variações (tamanho, cor…), quantidade e botão **Adicionar**.
- **Carrinho**: altera quantidades, remove itens, nome e observações opcionais e o botão
  **Enviar pedido pelo WhatsApp**, que abre a conversa com a mensagem já pronta:

  ```
  Olá! Gostaria de fazer este pedido:

  • 2x Camiseta Básica (GG) — R$ 129,80
  • 1x Caneca Esmaltada — R$ 39,90

  *Total: R$ 169,70*

  Nome: Maria
  ```
- **Admin (`/admin`)**: login; cadastrar, editar, ocultar e excluir produtos (nome, categoria, preço,
  descrição, várias fotos, variações com preço próprio opcional). Na aba **Configurações** ficam o nome
  da loja, uma frase curta e o número de WhatsApp que recebe os pedidos.

Preço vazio aparece como "Sob consulta". Se as variações têm preços diferentes, o card mostra
"a partir de". As fotos são reduzidas automaticamente antes do envio (fotos de celular ficam leves).

## Configuração (uma vez só)

### 1. Supabase (banco, fotos e login do admin)

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito basta).
2. Em **SQL Editor → New query**, cole o conteúdo de [`supabase/001_catalogo.sql`](supabase/001_catalogo.sql)
   e clique em **Run**. Isso cria as tabelas, o bucket de fotos `produtos` e as regras de acesso.
3. Em **Authentication → Users → Add user → Create new user**, crie o login do admin (e-mail e senha,
   marque *Auto Confirm User*).
4. **Importante:** em **Authentication → Sign In / Providers → Email**, desative
   **Allow new users to sign up**. Qualquer pessoa logada pode editar o catálogo, então só quem você
   criou no passo 3 deve conseguir entrar.
5. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / public**.

### 2. Vercel (hospedagem)

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe este repositório.
2. A Vercel detecta Vite sozinha (não precisa mudar o Root Directory).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Depois acesse `https://seu-site.vercel.app/admin`, entre, preencha a aba
   **Configurações** (principalmente o WhatsApp) e cadastre os produtos.

A chave *anon* pode ficar no front-end: quem protege os dados são as regras (RLS) do SQL. Visitantes
só leem produtos ativos; só usuários logados gravam.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional: preencha com os dados do Supabase
npm run dev
```

Sem o `.env.local` o site roda em **modo local**: o admin abre sem login e tudo fica salvo só no
navegador (bom para testar o visual; cabem poucas fotos).

## Estrutura

```
src/
  pages/StorePage.tsx      loja: busca, categorias, lista
  pages/AdminPage.tsx      admin: login, lista de produtos, configurações
  pages/ProductForm.tsx    formulário de produto (fotos, variações)
  components/              cabeçalho, menu, card do produto, carrinho, fotos em tela cheia
  cart/CartContext.tsx     carrinho (salvo no navegador do cliente)
  data/                    Supabase ou localStorage, mesma interface
  lib/whatsapp.ts          monta a mensagem e o link wa.me
  styles.css               cores (variáveis no topo: troque --orange para mudar o tom)
supabase/001_catalogo.sql  banco + bucket de fotos + regras
```
