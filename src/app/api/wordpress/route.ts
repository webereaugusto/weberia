import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { load } from 'cheerio';

// Configuração para permitir requisições mais longas
export const maxDuration = 60; // 60 segundos

type WordPressPostData = {
  title: string;
  content: string;
  categoryId?: number;
};

type WordPressAPIResponse = {
  success: boolean;
  message?: string;
  postId?: string;
  postUrl?: string;
  error?: string;
};

type WordPressRESTResponse = {
  id: number;
  link: string;
  [key: string]: unknown;
};

export async function POST(request: Request): Promise<NextResponse<WordPressAPIResponse>> {
  try {
    const data = await request.json() as WordPressPostData;

    if (!data.title || !data.content) {
      return NextResponse.json(
        { success: false, error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Credenciais para autenticação
    const username = "chat";
    const password = "dGkO4*!ZsEVZ60z4skZiIJdv";
    
    // Formatando o conteúdo para HTML
    const formattedContent = data.content.replace(/\n/g, '<br />');
    
    console.log('Tentando publicar post com título:', data.title);
    
    // Abordagem 1: Tentando usar a API de aplicação do WordPress (wp-admin)
    try {
      console.log('Tentando abordagem via wp-admin...');
      
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
      
      console.log('Cookies recebidos:', cookies);
      
      // Obtendo o formulário de criação de post para extrair campos necessários
      const getPostFormResponse = await axiosInstance.get(
        'https://megacubbo.com.br/wp-admin/post-new.php',
        {
          headers: {
            'Cookie': cookies.join('; ')
          }
        }
      );
      
      // Usando cheerio para extrair campos do formulário
      const $ = load(getPostFormResponse.data);
      const nonce = $('#_wpnonce').val();
      const postId = $('#post_ID').val();
      const userID = $('#user-id').val();
      
      console.log('Nonce:', nonce);
      console.log('Post ID:', postId);
      console.log('User ID:', userID);
      
      if (!nonce) {
        throw new Error('Não foi possível obter o nonce do formulário');
      }
      
      // Criando o post
      const postFormData = new URLSearchParams();
      postFormData.append('post_title', data.title);
      postFormData.append('content', formattedContent);
      postFormData.append('post_status', 'publish');
      postFormData.append('_wpnonce', nonce.toString());
      postFormData.append('action', 'editpost');
      postFormData.append('post_type', 'post');
      postFormData.append('original_publish', 'Publicar');
      postFormData.append('publish', 'Publicar');
      
      // Adicionando a categoria, se fornecida
      if (data.categoryId) {
        postFormData.append('post_category[]', data.categoryId.toString());
      }
      
      if (postId) postFormData.append('post_ID', postId.toString());
      if (userID) postFormData.append('user_ID', userID.toString());
      
      // Enviando o formulário para criar o post
      const postResponse = await axiosInstance.post(
        'https://megacubbo.com.br/wp-admin/post.php',
        postFormData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookies.join('; ')
          }
        }
      );
      
      console.log('Post criado via wp-admin, status:', postResponse.status);
      
      // Verificando se o post foi criado com sucesso
      if (postResponse.data.includes('Post published.') || postResponse.data.includes('Post publicado.')) {
        // Extraindo o ID do post criado
        const postUrlMatch = postResponse.data.match(/post\.php\?post=(\d+)&action=edit/);
        const createdPostId = postUrlMatch ? postUrlMatch[1] : 'desconhecido';
        
        console.log('Post criado com ID:', createdPostId);
        
        return NextResponse.json({
          success: true,
          message: 'Post publicado com sucesso via wp-admin',
          postId: createdPostId,
          postUrl: `https://megacubbo.com.br/?p=${createdPostId}`
        });
      } else {
        // Se não encontrou a mensagem de sucesso, pode ter ocorrido um erro
        console.log('Resposta não contém confirmação de publicação');
        throw new Error('Não foi possível confirmar a publicação do post');
      }
    } catch (error) {
      console.error('Erro ao usar wp-admin:', error instanceof Error ? error.message : 'Erro desconhecido');
      console.log('Detalhes do erro wp-admin:', error instanceof AxiosError ? error.response?.data : 'Sem detalhes');
    }
    
    // Abordagem 2: Tentando usar a API REST do WordPress com Application Password
    try {
      console.log('Tentando abordagem com API REST...');
      
      // Endpoint da API REST do WordPress
      const apiUrl = "https://megacubbo.com.br/wp-json/wp/v2/posts";
      
      // Formatando os dados do post para o formato esperado pelo WordPress
      const postData: Record<string, unknown> = {
        title: data.title,
        content: formattedContent,
        status: "publish"
      };
      
      // Adicionando a categoria, se fornecida
      if (data.categoryId) {
        postData.categories = [data.categoryId];
      }
      
      // Criando o token de autenticação básica
      const token = Buffer.from(`${username}:${password}`).toString('base64');
      
      // Configuração do Axios com autenticação básica
      const response = await axios.post<WordPressRESTResponse>(
        apiUrl,
        postData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${token}`
          },
          timeout: 15000
        }
      );
      
      console.log('Resposta do WordPress API REST:', response.status);
      console.log('Dados da resposta:', response.data);
      
      if (response.data && response.data.id) {
        return NextResponse.json({
          success: true,
          message: 'Post publicado com sucesso via API REST',
          postId: response.data.id.toString(),
          postUrl: response.data.link
        });
      }
    } catch (error) {
      console.error('Erro ao usar API REST:', error instanceof Error ? error.message : 'Erro desconhecido');
      console.log('Detalhes do erro REST:', error instanceof AxiosError ? error.response?.data : 'Sem detalhes');
    }
    
    // Se todas as abordagens falharem, retornamos um erro
    return NextResponse.json(
      { success: false, error: 'Todas as tentativas de publicação falharam. Verifique os logs para mais detalhes.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Erro geral ao publicar no WordPress:', error);
    
    let errorMessage = 'Erro ao publicar no WordPress';
    let statusCode = 500;
    
    if (error instanceof AxiosError) {
      console.log('Resposta de erro:', JSON.stringify(error.response?.data));
      errorMessage = `Erro ${error.response?.status}: ${error.response?.data?.message || 'Erro desconhecido'}`;
      statusCode = error.response?.status || 500;
      
      // Verificando se é um erro de permissão
      if (error.response?.status === 401) {
        errorMessage = 'Erro de autenticação: Verifique se o usuário tem permissão para criar posts.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Erro de permissão: O usuário não tem permissão para criar posts.';
      }
    } else if (error instanceof Error) {
      console.log('Erro na configuração da requisição:', error.message);
      errorMessage = `Erro na requisição: ${error.message}`;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
} 