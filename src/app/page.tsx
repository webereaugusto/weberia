"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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

// Componente de carregamento
const Loading = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <h2 className="text-xl font-semibold text-gray-700">Carregando aplicação...</h2>
    <p className="text-gray-500 mt-2">Por favor, aguarde enquanto preparamos tudo para você.</p>
  </div>
);

// Carregamento dinâmico do componente principal
const MainApp = dynamic(() => import('../components/MainApp'), {
  loading: () => <Loading />,
  ssr: false
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Renderizar o componente de carregamento até confirmar que estamos no cliente
  if (!isClient) {
    return <Loading />;
  }

  // Renderizar o componente principal
  return <MainApp />;
}
