import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Tipo para o conteúdo gerado pela IA
type AIGeneratedContent = {
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
    apiKey
  });
};

/**
 * Gera conteúdo para um post do WordPress usando a API da OpenAI
 */
export async function POST(request: NextRequest): Promise<NextResponse<APIResponse>> {
  try {
    // Extrai o tema do corpo da requisição
    const { theme } = await request.json();
    
    if (!theme) {
      return NextResponse.json({
        success: false,
        error: "O tema não foi fornecido"
      }, { status: 400 });
    }
    
    console.log("Gerando conteúdo para o tema:", theme);
    
    // Verifica se a chave da API está disponível
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.log("Chave da API OpenAI não configurada, retornando conteúdo de exemplo");
      
      return NextResponse.json({
        success: true,
        data: {
          title: `Post sobre ${theme}`,
          content: `Este é um conteúdo de exemplo sobre ${theme}. A integração com OpenAI não está disponível no momento porque a chave da API não foi configurada.`
        }
      });
    }
    
    const openai = getOpenAIClient();
    
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
    console.log("Resposta da OpenAI:", response);
    
    // Processa a resposta para extrair título e conteúdo
    const titleMatch = response.match(/TÍTULO:\s*(.*?)(?:\n|$)/);
    const contentMatch = response.match(/CONTEÚDO:\s*([\s\S]*?)$/);
    
    const title = titleMatch ? titleMatch[1].trim() : `Post sobre ${theme}`;
    const content = contentMatch 
      ? contentMatch[1].trim() 
      : response.replace(/TÍTULO:\s*(.*?)(?:\n|$)/, "").trim();
    
    return NextResponse.json({
      success: true,
      data: { title, content }
    });
  } catch (error) {
    console.error("Erro ao gerar conteúdo com OpenAI:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 