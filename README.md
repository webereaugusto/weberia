# WordPress Post Creator com IA

Aplicação Next.js para criar posts no WordPress com ajuda de IA.

## Funcionalidades

- Criação manual de posts
- Geração de conteúdo com IA (OpenAI)
- Seleção de categorias
- Interface moderna e responsiva
- Feedback em tempo real
- Tratamento de erros

## Requisitos

- Node.js 18.0 ou superior
- Conta no WordPress com permissões de administrador
- Chave de API da OpenAI

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env.local`:
   ```env
   WORDPRESS_USERNAME=seu_usuario
   WORDPRESS_PASSWORD=sua_senha
   WORDPRESS_URL=https://seu-site.com
   OPENAI_API_KEY=sua_chave_da_openai
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy

Esta aplicação está otimizada para deploy na Vercel. Para fazer o deploy:

1. Crie uma conta na [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente no painel da Vercel
4. Faça o deploy

## Tecnologias Utilizadas

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- WordPress REST API

## Uso

1. Escolha entre criar um post manualmente ou com ajuda de IA
2. Se escolher IA:
   - Digite um tema para o post
   - Aguarde a geração do conteúdo
   - Revise e aprove ou rejeite o conteúdo gerado
3. Se escolher manual:
   - Preencha o título do post
   - Adicione o conteúdo do post
4. Selecione uma categoria
5. Clique em "Publicar Post"
6. Aguarde a confirmação e acesse o link do post publicado

## Segurança

- Nunca compartilhe suas credenciais ou chaves de API
- Em produção, todas as credenciais devem ser armazenadas como variáveis de ambiente
- A geração de conteúdo com IA deve ser feita no servidor em ambiente de produção
- Mantenha o WordPress e seus plugins atualizados

## Suporte

Para relatar problemas ou sugerir melhorias, abra uma issue no repositório.
