import { NextResponse } from 'next/server';
import axios from 'axios';

// Tipos para a resposta da API
type Category = {
  id: number;
  name: string;
  slug: string;
};

type CategoriesResponse = {
  success: boolean;
  categories?: Category[];
  error?: string;
};

// Função para buscar categorias do WordPress
export async function GET(): Promise<NextResponse<CategoriesResponse>> {
  try {
    // Obter credenciais do ambiente
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpPassword = process.env.WORDPRESS_PASSWORD;

    if (!wpUrl || !wpUsername || !wpPassword) {
      console.error('Credenciais do WordPress não configuradas');
      return NextResponse.json({
        success: false,
        error: 'Credenciais do WordPress não configuradas'
      }, { status: 500 });
    }

    // Configurar autenticação básica
    const auth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');

    // Fazer requisição para a API REST do WordPress
    const response = await axios.get(`${wpUrl}/wp-json/wp/v2/categories`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      params: {
        per_page: 100 // Limite de categorias a serem retornadas
      }
    });

    // Processar e formatar as categorias
    const categories = response.data.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug
    }));

    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias do WordPress:', error);
    
    // Formatar mensagem de erro
    let errorMessage = 'Erro ao buscar categorias do WordPress';
    if (axios.isAxiosError(error)) {
      errorMessage += `: ${error.response?.data?.message || error.message}`;
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    // Retornar resposta de erro
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 