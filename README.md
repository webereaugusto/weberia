# Weberia - Publicador WordPress com IA

Este projeto é uma aplicação Next.js que permite criar e publicar posts no WordPress, com a opção de gerar conteúdo automaticamente usando a API da OpenAI.

## Funcionalidades

- Criação manual de posts para WordPress
- Geração automática de conteúdo usando IA (OpenAI)
- Seleção de categorias do WordPress
- Interface amigável e responsiva

## Configuração

Para configurar o projeto, você precisa definir as seguintes variáveis de ambiente no arquivo `.env.local`:

```
# Variáveis de ambiente para o WordPress
WORDPRESS_URL=https://seu-site-wordpress.com
WORDPRESS_USERNAME=seu-usuario
WORDPRESS_PASSWORD=sua-senha

# Chave da API OpenAI
OPENAI_API_KEY=sua-chave-da-api-openai
```

## Etapas para fazer o projeto funcionar

Aqui estão as etapas que foram necessárias para fazer o projeto funcionar corretamente:

1. **Configuração do Next.js**
   - Ajuste do `next.config.js` para lidar com a API do WordPress
   - Configuração do ESLint para evitar erros de compilação

2. **Correção de tipos TypeScript**
   - Definição de tipos adequados para as respostas da API
   - Correção de erros de tipagem em arquivos de rota

3. **Implementação da geração de conteúdo com IA**
   - Criação de uma API dedicada para comunicação com a OpenAI
   - Configuração do modelo `gpt-4o-mini` para reduzir custos
   - Processamento adequado das respostas da API

4. **Correção de problemas com variáveis de ambiente**
   - Uso de `OPENAI_API_KEY` para o lado do servidor
   - Fallback para `NEXT_PUBLIC_OPENAI_API_KEY` quando necessário

5. **Melhorias na interface do usuário**
   - Adição de feedback visual durante a geração de conteúdo
   - Melhor tratamento de erros e exibição de mensagens informativas

## Tecnologias utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI API
- WordPress REST API

## Como executar

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar em modo de produção
npm start
```

## Implantação

O projeto está configurado para implantação na Vercel. Ao fazer push para o repositório, a Vercel automaticamente inicia uma nova implantação.
