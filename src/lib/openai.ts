import OpenAI from 'openai';

// Configuração da API da OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Permitir uso no navegador (em produção, isso deve ser feito apenas no servidor)
});

// Função para gerar conteúdo de post com base em um tema
export async function generatePostContent(theme: string): Promise<{ title: string; content: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em criar conteúdo para blogs. Crie um título atraente e um conteúdo informativo e bem estruturado para um post de blog."
        },
        {
          role: "user",
          content: `Crie um post de blog sobre o tema: "${theme}". Forneça um título atraente e um conteúdo informativo com pelo menos 3 parágrafos. Responda no formato JSON com as propriedades "title" e "content".`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("Não foi possível gerar conteúdo");
    }

    const parsedResult = JSON.parse(result);
    return {
      title: parsedResult.title,
      content: parsedResult.content
    };
  } catch (error) {
    console.error("Erro ao gerar conteúdo com a OpenAI:", error);
    throw error;
  }
} 