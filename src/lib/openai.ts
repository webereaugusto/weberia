"use client";

import OpenAI from 'openai';

// Tipo para o conteúdo gerado pela IA
export type AIGeneratedContent = {
  title: string;
  content: string;
};

// Inicializa o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Permite uso no navegador (cliente)
});

/**
 * Gera conteúdo para um post do WordPress usando a API da OpenAI
 * @param theme O tema ou assunto para o qual gerar conteúdo
 * @returns Um objeto contendo o título e o conteúdo gerado
 */
export async function generatePostContent(theme: string): Promise<AIGeneratedContent> {
  try {
    // Cria o prompt para a API
    const prompt = `
      Crie um post de blog em português do Brasil sobre o tema: "${theme}".
      
      O post deve incluir:
      1. Um título atraente e otimizado para SEO
      2. Uma introdução envolvente
      3. Pelo menos 3 seções com conteúdo relevante
      4. Uma conclusão
      
      Formate o conteúdo em parágrafos bem estruturados.
      Não inclua cabeçalhos HTML, apenas o texto puro.
      
      Responda no seguinte formato:
      TÍTULO: [título do post]
      CONTEÚDO: [conteúdo completo do post]
    `;

    // Faz a chamada para a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um redator profissional especializado em criar conteúdo para blogs." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Extrai a resposta
    const response = completion.choices[0]?.message?.content || "";
    
    // Processa a resposta para extrair título e conteúdo
    const titleMatch = response.match(/TÍTULO:\s*(.*?)(?:\n|$)/);
    const contentMatch = response.match(/CONTEÚDO:\s*([\s\S]*?)$/);
    
    const title = titleMatch ? titleMatch[1].trim() : `Post sobre ${theme}`;
    const content = contentMatch 
      ? contentMatch[1].trim() 
      : response.replace(/TÍTULO:\s*(.*?)(?:\n|$)/, "").trim();
    
    return { title, content };
  } catch (error) {
    console.error("Erro ao gerar conteúdo com OpenAI:", error);
    throw new Error(`Falha ao gerar conteúdo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 