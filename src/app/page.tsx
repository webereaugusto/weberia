"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { generatePostContent } from "@/lib/openai";

type CreationMode = "manual" | "ai" | null;

type Category = {
  id: number;
  name: string;
  slug: string;
};

type AIGeneratedContent = {
  title: string;
  content: string;
};

type APIError = {
  error: string;
  details?: unknown;
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "generating" | "loadingCategories">("loadingCategories");
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [theme, setTheme] = useState("");
  const [aiGeneratedContent, setAiGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Buscar categorias ao carregar a página
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setStatus("loadingCategories");
      setMessage("Carregando categorias...");
      
      const response = await axios.get<{ success: boolean; categories: Category[]; error?: string }>('/api/wordpress/categories');
      
      if (response.data.success && response.data.categories) {
        setCategories(response.data.categories);
        setStatus("idle");
        setMessage("");
      } else {
        throw new Error(response.data.error || "Erro ao carregar categorias");
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setStatus("error");
      setMessage("Erro ao carregar categorias. Por favor, recarregue a página.");
      setErrorDetails(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      setStatus("error");
      setMessage("Por favor, preencha todos os campos.");
      setErrorDetails(null);
      return;
    }

    await publishPost(title, content, selectedCategory);
  };

  const publishPost = async (postTitle: string, postContent: string, categoryId: number | null) => {
    setStatus("loading");
    setMessage("Enviando post...");
    setErrorDetails(null);
    setPostUrl(null);
    setPostId(null);

    try {
      // Usando nossa própria API como proxy para o WordPress
      const response = await axios.post<{ success: boolean; postUrl?: string; postId?: string; error?: string }>('/api/wordpress', {
        title: postTitle,
        content: postContent,
        categoryId: categoryId
      });

      console.log('Resposta recebida:', response.data);

      if (response.data.success) {
        setStatus("success");
        setMessage("Post publicado com sucesso!");
        
        // Salvando informações do post criado
        if (response.data.postUrl) {
          setPostUrl(response.data.postUrl);
        }
        if (response.data.postId) {
          setPostId(response.data.postId);
        }
        
        setTitle("");
        setContent("");
        setCreationMode(null);
        setTheme("");
        setAiGeneratedContent(null);
        setSelectedCategory(null);
      } else {
        setStatus("error");
        setMessage(`Erro ao publicar o post: ${response.data.error || 'Erro desconhecido'}`);
        setErrorDetails(JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error("Erro ao publicar post:", error);
      
      // Mensagem de erro mais detalhada
      let errorMsg = "Erro ao publicar o post.";
      if (error instanceof AxiosError) {
        // O servidor respondeu com um status de erro
        const apiError = error.response?.data as APIError;
        errorMsg += ` ${apiError?.error || ''}`;
        console.log('Detalhes do erro:', apiError);
        setErrorDetails(JSON.stringify(apiError, null, 2));
      } else if (error instanceof Error) {
        // Algo aconteceu na configuração da requisição
        errorMsg += ` ${error.message}`;
        setErrorDetails(error.message);
      }
      
      setStatus("error");
      setMessage(errorMsg);
    }
  };

  const handleTryAgain = () => {
    setStatus("idle");
    setMessage("");
    setErrorDetails(null);
    setPostUrl(null);
    setPostId(null);
    setCreationMode(null);
    setTheme("");
    setAiGeneratedContent(null);
    setSelectedCategory(null);
  };

  const handleGenerateWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme) {
      setStatus("error");
      setMessage("Por favor, informe um tema para gerar o conteúdo.");
      return;
    }

    setStatus("generating");
    setMessage("Gerando conteúdo com IA...");
    setErrorDetails(null);

    try {
      const generatedContent = await generatePostContent(theme);
      setAiGeneratedContent(generatedContent);
      setTitle(generatedContent.title);
      setContent(generatedContent.content);
      setStatus("idle");
    } catch (error) {
      console.error("Erro ao gerar conteúdo com IA:", error);
      setStatus("error");
      setMessage(`Erro ao gerar conteúdo com IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setErrorDetails(error instanceof Error ? error.toString() : 'Erro desconhecido');
    }
  };

  const handleApproveAIContent = () => {
    if (aiGeneratedContent) {
      publishPost(aiGeneratedContent.title, aiGeneratedContent.content, selectedCategory);
    }
  };

  const handleRejectAIContent = () => {
    setStatus("idle");
    setAiGeneratedContent(null);
  };

  const showForm = status === "idle" || status === "error";
  const showModeSelection = showForm && !creationMode;
  const showManualForm = showForm && creationMode === "manual";
  const showAIForm = showForm && creationMode === "ai" && !aiGeneratedContent;
  const showAIPreview = showForm && creationMode === "ai" && aiGeneratedContent;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Adicionar Novo Post no WordPress
        </h1>
        
        {status === "success" && (
          <div className="mb-4">
            <div className="p-3 bg-green-100 text-green-700 rounded">
              {message}
            </div>
            {postUrl && (
              <div className="mt-2 p-3 border border-green-200 rounded">
                <p className="font-medium mb-1">Post publicado:</p>
                <a 
                  href={postUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {postUrl}
                </a>
                {postId && (
                  <p className="text-sm text-gray-600 mt-1">
                    ID do post: {postId}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {status === "error" && (
          <div className="mb-4">
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {message}
            </div>
            {errorDetails && (
              <details className="mt-2 p-2 border border-red-200 rounded text-sm">
                <summary className="cursor-pointer font-medium">Ver detalhes do erro</summary>
                <pre className="mt-2 p-2 bg-gray-100 overflow-auto text-xs">{errorDetails}</pre>
              </details>
            )}
            <button
              onClick={handleTryAgain}
              className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Tentar Novamente
            </button>
          </div>
        )}
        
        {(status === "loading" || status === "loadingCategories") && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {message || "Carregando..."}
          </div>
        )}
        
        {status === "generating" && (
          <div className="mb-4 p-3 bg-purple-100 text-purple-700 rounded flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {message}
          </div>
        )}
        
        {showModeSelection && (
          <div className="space-y-4">
            <p className="text-center text-gray-700 mb-4">Como você deseja criar seu post?</p>
            <button
              onClick={() => setCreationMode("manual")}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Criar Manualmente
            </button>
            <button
              onClick={() => setCreationMode("ai")}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Criar com Ajuda de IA
            </button>
          </div>
        )}
        
        {(showManualForm || showAIForm || showAIPreview) && (
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              id="category"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {showManualForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Digite o título do post"
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Conteúdo
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Digite o conteúdo do post"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCreationMode(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Publicar Post
              </button>
            </div>
          </form>
        )}
        
        {showAIForm && (
          <form onSubmit={handleGenerateWithAI} className="space-y-6">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Tema para o Post
              </label>
              <input
                type="text"
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Inteligência Artificial, Receitas Veganas, Dicas de Viagem..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Informe um tema e a IA irá gerar um título e conteúdo para seu post.
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCreationMode(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Gerar com IA
              </button>
            </div>
          </form>
        )}
        
        {showAIPreview && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Conteúdo Gerado pela IA</h3>
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h4 className="font-bold text-lg mb-2">{title}</h4>
                <div className="prose prose-sm max-w-none">
                  {content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleRejectAIContent}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Rejeitar
              </button>
              <button
                type="button"
                onClick={handleApproveAIContent}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Aprovar e Publicar
              </button>
            </div>
            
            <div>
              <button
                type="button"
                onClick={() => {
                  setTheme("");
                  setAiGeneratedContent(null);
                }}
                className="w-full py-2 px-4 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Tentar com Outro Tema
              </button>
            </div>
            
            <div>
              <button
                type="button"
                onClick={() => {
                  setCreationMode("manual");
                }}
                className="w-full py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Editar Manualmente
              </button>
            </div>
          </div>
        )}
        
        {status === "success" && (
          <div className="mt-4">
            <button
              onClick={handleTryAgain}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Criar Novo Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
