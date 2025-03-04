/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilita a geração estática incremental por padrão
  staticPageGenerationTimeout: 0,
  
  // Configuração do ambiente
  env: {
    WORDPRESS_URL: 'https://megacubbo.com.br',
    WORDPRESS_USERNAME: 'chat',
    WORDPRESS_PASSWORD: 'dGkO4*!ZsEVZ60z4skZiIJdv'
  },

  // Configurações de imagens
  images: {
    domains: ['megacubbo.com.br'],
  },

  // Configurações do servidor
  experimental: {
    // Remover serverActions pois já está disponível por padrão
  },

  webpack: (config) => {
    config.externals = [...(config.externals || []), "canvas", "jsdom"];
    return config;
  },
}

module.exports = nextConfig 