import { NextResponse } from 'next/server';
import axios from 'axios';

// Configuração para permitir requisições mais longas
export const maxDuration = 60; // 60 segundos

type Category = {
  id: number;
  name: string;
  slug: string;
};

type WordPressAPIResponse = {
  success: boolean;
  categories: Category[];
  error?: string;
};

export async function GET(): Promise<NextResponse<WordPressAPIResponse>> {
  try {
    console.log('Buscando categorias do WordPress...');
    
    // Endpoint da API REST do WordPress para categorias
    const apiUrl = "https://megacubbo.com.br/wp-json/wp/v2/categories";
    
    // Configuração do Axios
    const response = await axios.get(apiUrl, {
      timeout: 10000
    });
    
    console.log('Resposta recebida:', response.status);
    
    if (response.data && Array.isArray(response.data)) {
      // Mapeando os dados para o formato que precisamos
      const categories: Category[] = response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      }));
      
      console.log(`${categories.length} categorias encontradas`);
      
      return NextResponse.json({
        success: true,
        categories
      });
    } else {
      console.error('Formato de resposta inesperado:', response.data);
      return NextResponse.json({
        success: false,
        categories: [],
        error: 'Formato de resposta inesperado'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    
    let errorMessage = 'Erro ao buscar categorias';
    let statusCode = 500;
    
    if (axios.isAxiosError(error)) {
      errorMessage = `Erro ${error.response?.status || 'desconhecido'}: ${error.message}`;
      statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      categories: [],
      error: errorMessage
    }, { status: statusCode });
  }
} 