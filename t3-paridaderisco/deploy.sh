#!/bin/bash

# Script de Deploy para Servidor Hetzner
# Este script faz o build e deploy da aplicação ParidadeRisco

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy da aplicação ParidadeRisco..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Crie um arquivo .env baseado no .env.example"
    exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    exit 1
fi

# Parar containers antigos
echo -e "${YELLOW}🛑 Parando containers antigos...${NC}"
docker-compose down || true

# Remover imagem antiga (opcional - economiza espaço)
echo -e "${YELLOW}🗑️  Removendo imagens antigas...${NC}"
docker image prune -f

# Build da nova imagem
echo -e "${YELLOW}🔨 Construindo nova imagem Docker...${NC}"
docker-compose build --no-cache

# Subir containers
echo -e "${YELLOW}🚢 Subindo containers...${NC}"
docker-compose up -d

# Aguardar a aplicação ficar pronta
echo -e "${YELLOW}⏳ Aguardando aplicação iniciar...${NC}"
sleep 10

# Verificar se está rodando
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo ""
    echo -e "${GREEN}📊 Status dos containers:${NC}"
    docker-compose ps
    echo ""
    echo -e "${GREEN}🌐 Aplicação disponível em:${NC}"
    echo "   http://localhost:3000"
    echo ""
    echo -e "${YELLOW}📝 Para ver os logs:${NC}"
    echo "   docker-compose logs -f app"
else
    echo -e "${RED}❌ Erro ao iniciar containers!${NC}"
    echo "Verifique os logs com: docker-compose logs"
    exit 1
fi
