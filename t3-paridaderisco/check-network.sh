#!/bin/bash

# Script para verificar e configurar rede Docker para Nginx Proxy Manager
# Execute este script ANTES do deploy

set -e

echo "🔍 Verificando configuração de rede Docker..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se Nginx Proxy Manager está rodando
echo -e "${YELLOW}📡 Verificando Nginx Proxy Manager...${NC}"
if docker ps | grep -q npm-app; then
    echo -e "${GREEN}✅ Nginx Proxy Manager encontrado${NC}"
    NPM_CONTAINER=$(docker ps | grep npm-app | awk '{print $1}')
else
    echo -e "${RED}❌ Nginx Proxy Manager não encontrado!${NC}"
    echo "Certifique-se de que o Nginx Proxy Manager está rodando."
    exit 1
fi

# Detectar rede do Nginx Proxy Manager
echo ""
echo -e "${YELLOW}🌐 Detectando rede do Nginx Proxy Manager...${NC}"
NPM_NETWORK=$(docker inspect $NPM_CONTAINER --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}')

if [ -z "$NPM_NETWORK" ]; then
    echo -e "${RED}❌ Não foi possível detectar a rede!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Rede detectada: ${NPM_NETWORK}${NC}"

# Verificar se docker-compose.yml existe
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}❌ docker-compose.yml não encontrado!${NC}"
    exit 1
fi

# Verificar qual rede está configurada no docker-compose.yml
CURRENT_NETWORK=$(grep -A 1 "external: true" docker-compose.yml | head -1 | awk '{print $1}' | sed 's/://')

echo ""
echo -e "${YELLOW}📄 Configuração atual no docker-compose.yml:${NC}"
echo "   Rede configurada: ${CURRENT_NETWORK}"
echo "   Rede detectada: ${NPM_NETWORK}"

# Comparar e sugerir mudança se necessário
if [ "$CURRENT_NETWORK" != "$NPM_NETWORK" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  As redes não coincidem!${NC}"
    echo ""
    echo "Você precisa atualizar o docker-compose.yml:"
    echo ""
    echo "Substitua:"
    echo "  ${CURRENT_NETWORK}:"
    echo "    external: true"
    echo ""
    echo "Por:"
    echo "  ${NPM_NETWORK}:"
    echo "    external: true"
    echo ""
    read -p "Deseja atualizar automaticamente? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        # Fazer backup
        cp docker-compose.yml docker-compose.yml.bak
        echo -e "${GREEN}✅ Backup criado: docker-compose.yml.bak${NC}"

        # Substituir rede
        sed -i "s/${CURRENT_NETWORK}:/${NPM_NETWORK}:/g" docker-compose.yml
        echo -e "${GREEN}✅ docker-compose.yml atualizado!${NC}"
    else
        echo -e "${YELLOW}⚠️  Atualize manualmente antes de continuar${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Configuração de rede correta!${NC}"
fi

# Listar todas as redes disponíveis
echo ""
echo -e "${YELLOW}📋 Redes Docker disponíveis:${NC}"
docker network ls

echo ""
echo -e "${GREEN}✅ Verificação completa!${NC}"
echo ""
echo "Próximo passo: Execute ./deploy.sh para fazer o deploy"
