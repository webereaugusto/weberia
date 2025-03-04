import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { load } from 'cheerio';

type Category = {
  id: number;
  name: string;
  slug: string;
};

export async function GET() {
  try {
    // Primeiro, tentamos usar a API REST
    try {
      // Credenciais para autenticação
      const username = "chat";
      const password = "dGkO4*!ZsEVZ60z4skZiIJdv";
      
      // Criando o token de autenticação básica
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      
      // URL da API do WordPress para buscar categorias
      const apiUrl = 'https://megacubbo.com.br/wp-json/wp/v2/categories';

      // Fazendo a requisição para buscar as categorias
      const response = await axios.get<Category[]>(apiUrl, {
        params: {
          per_page: 100, // Número máximo de categorias a serem retornadas
          _fields: 'id,name,slug', // Campos que queremos retornar
        },
        headers: {
          'Authorization': `Basic ${token}`
        }
      });

      console.log('Categorias obtidas com sucesso via API REST:', response.data.length);
      
      // Retornando as categorias em formato JSON
      return NextResponse.json({
        success: true,
        categories: response.data
      });
    } catch (error) {
      console.log('Erro ao buscar categorias via API REST, tentando abordagem alternativa...');
      
      // Se a API REST falhar, tentamos a abordagem via wp-admin
      // Credenciais para autenticação
      const username = "chat";
      const password = "dGkO4*!ZsEVZ60z4skZiIJdv";
      
      // Primeiro, vamos fazer login no WordPress
      const loginFormData = new URLSearchParams();
      loginFormData.append('log', username);
      loginFormData.append('pwd', password);
      loginFormData.append('wp-submit', 'Log In');
      loginFormData.append('redirect_to', 'https://megacubbo.com.br/wp-admin/');
      loginFormData.append('testcookie', '1');
      
      // Criando uma instância do axios com suporte a cookies
      const axiosInstance = axios.create({
        withCredentials: true,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Fazendo login
      const loginResponse = await axiosInstance.post(
        'https://megacubbo.com.br/wp-login.php',
        loginFormData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Login realizado, status:', loginResponse.status);
      
      // Extraindo cookies da resposta
      const cookies = loginResponse.headers['set-cookie'];
      if (!cookies || cookies.length === 0) {
        throw new Error('Não foi possível obter cookies de autenticação');
      }
      
      // Acessando a página de categorias
      const categoriesPageResponse = await axiosInstance.get(
        'https://megacubbo.com.br/wp-admin/edit-tags.php?taxonomy=category',
        {
          headers: {
            'Cookie': cookies.join('; ')
          }
        }
      );
      
      // Usando cheerio para extrair as categorias da página
      const $ = load(categoriesPageResponse.data);
      const categories: Category[] = [];
      
      // Encontrando a tabela de categorias
      $('#the-list tr').each((i, element) => {
        const id = $(element).attr('id')?.replace('tag-', '');
        if (id) {
          const name = $(element).find('.row-title').text().trim();
          const slug = $(element).find('.slug').text().trim();
          
          categories.push({
            id: parseInt(id),
            name,
            slug
          });
        }
      });
      
      console.log('Categorias obtidas com sucesso via wp-admin:', categories.length);
      
      return NextResponse.json({
        success: true,
        categories
      });
    }
  } catch (error) {
    console.error('Erro ao buscar categorias do WordPress:', error);
    
    let errorMessage = 'Erro ao buscar categorias';
    let errorDetails: unknown = null;
    
    if (error instanceof AxiosError) {
      errorMessage = `Erro ao buscar categorias: ${error.response?.status}`;
      errorDetails = error.response?.data;
    } else if (error instanceof Error) {
      errorMessage = `Erro: ${error.message}`;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
} 