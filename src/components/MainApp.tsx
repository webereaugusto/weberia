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
  details?: string;
};

type WordPressResponse = {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
};

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
  error?: string;
};

type WordPressErrorResponse = {
  message?: string;
  code?: string;
  data?: {
    status: number;
  };
};

export default function MainApp() {
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
      
      const response = await axios.get<CategoriesResponse>('/api/wordpress/categories');
      
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
      const response = await axios.post<WordPressResponse>('/api/wordpress', {
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
        const errorResponse = error.response?.data as WordPressErrorResponse;
        errorMsg += ` ${errorResponse?.message || ''}`;
        console.log('Detalhes do erro:', errorResponse);
        setErrorDetails(JSON.stringify(errorResponse, null, 2));
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
      console.log("Iniciando geração de conteúdo para o tema:", theme);
      const generatedContent = await generatePostContent(theme);
      console.log("Conteúdo gerado:", generatedContent);
      
      if (!generatedContent.title || !generatedContent.content) {
        throw new Error("O conteúdo gerado está incompleto ou vazio");
      }
      
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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
            <button
              onClick={handleTryAgain}
              className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Criar Outro Post
            </button>
          </div>
        )}
        
        {(status === "loading" || status === "generating" || status === "loadingCategories") && (
          <div className="mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-700">{message}</span>
              {status === "generating" && (
                <span className="ml-2 text-xs text-blue-600">
                  (Isso pode levar alguns segundos...)
                </span>
              )}
            </div>
          </div>
        )}
        
        {status === "error" && (
          <div className="mb-4">
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {message}
            </div>
            {errorDetails && (
              <div className="mt-2 p-3 border border-red-200 rounded bg-gray-50">
                <p className="font-medium mb-1">Detalhes do erro:</p>
                <pre className="text-xs text-gray-800 overflow-auto max-h-40">{errorDetails}</pre>
              </div>
            )}
          </div>
        )}
        
        {showModeSelection && (
          <div className="mb-6">
            <p className="text-center text-gray-700 mb-4">Como você deseja criar o post?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCreationMode("manual")}
                className="bg-white border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
              >
                <div className="text-xl mb-2">✍️</div>
                <div className="font-medium text-gray-800">Manualmente</div>
                <div className="text-sm text-gray-500">Escrever o conteúdo</div>
              </button>
              
              <button
                onClick={() => setCreationMode("ai")}
                className="bg-white border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
              >
                <div className="text-xl mb-2">🤖</div>
                <div className="font-medium text-gray-800">Com IA</div>
                <div className="text-sm text-gray-500">Gerar com inteligência artificial</div>
              </button>
            </div>
          </div>
        )}
        
        {showManualForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Digite o título do post"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Digite o conteúdo do post"
                required
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="category"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">Selecione uma categoria (opcional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCreationMode(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publicar
              </button>
            </div>
          </form>
        )}
        
        {showAIForm && (
          <form onSubmit={handleGenerateWithAI} className="space-y-4">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                Tema para o Post
              </label>
              <input
                type="text"
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Ex: Benefícios da meditação, Receitas veganas, etc."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Digite um tema específico para obter melhores resultados
              </p>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="category"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">Selecione uma categoria (opcional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCreationMode(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Gerar Conteúdo
              </button>
            </div>
          </form>
        )}
        
        {showAIPreview && aiGeneratedContent && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Conteúdo Gerado pela IA</h3>
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h4 className="font-bold text-lg mb-2 text-gray-900">{aiGeneratedContent.title}</h4>
                <div className="prose prose-sm max-w-none text-gray-800">
                  {aiGeneratedContent.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRejectAIContent}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Rejeitar
              </button>
              <button
                onClick={handleApproveAIContent}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 