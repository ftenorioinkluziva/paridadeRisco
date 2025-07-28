#!/bin/bash

# Deploy script para produção na Hetzner
set -e

echo "🚀 Iniciando deploy para produção..."

# Verifica se o arquivo .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "Por favor, configure as variáveis de ambiente primeiro."
    exit 1
fi

# Carrega variáveis de ambiente de produção
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Fazendo build das imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down

echo "🗄️  Removendo imagens antigas não utilizadas..."
docker image prune -f

echo "🚀 Subindo containers em produção..."
docker-compose -f docker-compose.prod.yml up -d

echo "🔍 Verificando status dos containers..."
docker-compose -f docker-compose.prod.yml ps

echo "📋 Logs dos containers:"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo "✅ Deploy concluído!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:5001"