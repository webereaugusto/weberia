"use client";

import OpenAI from 'openai';

// Tipo para o conteúdo gerado pela IA
export type AIGeneratedContent = {
  title: string;
  content: string;
};

// Tipo para a resposta da API
type APIResponse = {
  success: boolean;
  data?: AIGeneratedContent;
  error?: string;
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
      
      const responseData = await response.json() as APIResponse;
      console.log("Resposta da API:", responseData);
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Erro desconhecido ao gerar conteúdo");
      }
      
      if (!responseData.data) {
        throw new Error("A API retornou uma resposta sem dados");
      }
      
      console.log("Conteúdo gerado com sucesso:", responseData.data);
      
      return responseData.data;
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
    throw error;
  }
} 