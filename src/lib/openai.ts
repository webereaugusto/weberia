"use client";

import OpenAI from 'openai';

// Tipo para o conteúdo gerado pela IA
export type AIGeneratedContent = {
  title: string;
  content: string;
};

// Inicializa o cliente OpenAI com a chave da API
const getOpenAIClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("A variável de ambiente NEXT_PUBLIC_OPENAI_API_KEY não está definida");
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Permite uso no navegador (cliente)
  });
};

/**
 * Gera conteúdo para um post do WordPress usando a API da OpenAI
 * @param theme O tema ou assunto para o qual gerar conteúdo
 * @returns Um objeto contendo o título e o conteúdo gerado
 */
export async function generatePostContent(theme: string): Promise<AIGeneratedContent> {
  try {
    console.log("Iniciando geração de conteúdo para o tema:", theme);
    
    // Verifica se estamos no navegador
    if (typeof window !== 'undefined') {
      console.log("Executando no navegador");
      
      // No navegador, fazemos uma chamada para nossa própria API
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Conteúdo gerado com sucesso:", data);
      
      return data;
    } else {
      // Fallback para quando não estamos no navegador (isso não deve acontecer com "use client")
      console.log("Não estamos no navegador, retornando conteúdo de fallback");
      return {
        title: `Post sobre ${theme}`,
        content: `Este é um conteúdo de exemplo sobre ${theme}. A integração com OpenAI não está disponível no momento.`
      };
    }
  } catch (error) {
    console.error("Erro ao gerar conteúdo com OpenAI:", error);
    
    // Retorna conteúdo de fallback em caso de erro
    return {
      title: `Post sobre ${theme}`,
      content: `Este é um conteúdo de exemplo sobre ${theme}. Não foi possível gerar conteúdo com a OpenAI devido a um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
} 