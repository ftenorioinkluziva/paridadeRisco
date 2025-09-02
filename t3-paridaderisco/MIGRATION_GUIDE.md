# 🗂️ Guia de Migração de Dados ParidadeRisco

Este guia detalha como migrar os dados do sistema legado para a nova base de dados T3 Stack.

## 📊 Visão Geral

O processo de migração irá popular a base de dados com:
- ✅ **7 ativos** financeiros (ETFs, Títulos, Moedas)
- ✅ **13,065 dados históricos** de preços
- ✅ **2 cestas** de investimento ("Risky Parity")
- ✅ **43 transações** de compra/venda
- ✅ **1 usuário** de teste com portfolio

## 🛠️ Pré-requisitos

1. **Base de dados configurada** - PostgreSQL rodando
2. **Variáveis de ambiente** - `.env` configurado com `DATABASE_URL`
3. **Dados legados** - Arquivos JSON na pasta `migration/migration/data/`
4. **Schema atualizado** - `prisma db push` executado

## 🚀 Comandos de Migração

### Opção 1: Seed Completo (Recomendado)
```bash
# Reset completo + seed dos dados
npm run db:reset
```

### Opção 2: Apenas Seed (sem reset)
```bash
# Apenas popular dados (cuidado com duplicações)
npm run db:seed
```

### Opção 3: Manual (step by step)
```bash
# 1. Aplicar schema
npm run db:push

# 2. Executar seed
npm run db:seed

# 3. Verificar no Prisma Studio
npm run db:studio
```

## 📋 Processo de Migração Detalhado

### Fase 1: Preparação
- 🧑‍💼 **Criar usuário de teste**
  - Email: `test@paridaderisco.com`
  - Senha: `password123` (hash exemplo)

### Fase 2: Dados Core
- 📈 **Ativos** → Migrar 7 ativos com tipos inferidos
- 📊 **Dados Históricos** → 13,065 registros (processamento em batch)
- 🗂️ **Cestas** → 2 cestas com relacionamentos
- 💰 **Transações** → 43 transações convertidas
- 💼 **Portfolio** → Portfolio inicial com saldo

### Fase 3: Validação
- ✅ **Integridade referencial** verificada
- ✅ **Contagens** de registros validadas
- ✅ **Relacionamentos** funcionando

## 🗺️ Mapeamento de Dados

### Ativos
```
LEGADO                    NOVO SCHEMA
------                    -----------
id: 2                  →  id: cuid()
ticker: "BOVA11.SA"    →  ticker: "BOVA11.SA"
nome: "BOVA11 (...)"   →  name: "BOVA11 (Ibovespa)"
-                      →  type: "ETF" (inferido)
-                      →  calculationType: PRECO
```

### Cestas + AtivosEmCestas
```
LEGADO                    NOVO SCHEMA
------                    -----------
id: 1                  →  id: cuid()
nome: "Risky Parity"   →  name: "Risky Parity"
ativos: {              →  AtivosEmCestas:
  "CDI": 20,           →    cestaId + ativoId + 20.00%
  "BOVA11.SA": 5       →    cestaId + ativoId + 5.00%
}
```

### Transações
```
LEGADO                    NOVO SCHEMA
------                    -----------
type: "buy"            →  type: COMPRA
quantity: 20           →  shares: 20.00000000
price: 10.26           →  pricePerShare: 10.26
ativo_id: 3            →  ativoId: (lookup CUID)
```

### Dados Históricos
```
LEGADO                    NOVO SCHEMA
------                    -----------
ticker: "BOVA11.SA"    →  ativoId: (lookup CUID)
fechamento: 131.38     →  price: 131.38
retorno_diario: 0.017  →  percentageChange: 0.017
data: "2025-04-24"     →  date: DateTime
```

## 🔍 Verificação Pós-Migração

### 1. Contagem de Registros
```sql
-- Verificar se todos os dados foram migrados
SELECT 'users' as table_name, count(*) as count FROM "User"
UNION ALL
SELECT 'ativos', count(*) FROM "Ativo"
UNION ALL
SELECT 'dados_historicos', count(*) FROM "DadoHistorico"
UNION ALL
SELECT 'cestas', count(*) FROM "Cesta"
UNION ALL
SELECT 'transacoes', count(*) FROM "Transacao"
UNION ALL
SELECT 'portfolios', count(*) FROM "Portfolio";
```

### 2. Integridade Referencial
```sql
-- Verificar relacionamentos
SELECT c.name as cesta, a.ticker, ac.targetPercentage
FROM "Cesta" c
JOIN "AtivosEmCestas" ac ON c.id = ac.cestaId
JOIN "Ativo" a ON ac.ativoId = a.id
ORDER BY c.name, ac.targetPercentage DESC;
```

### 3. Dados de Teste Prontos
Após a migração você terá:
- ✅ **Usuário**: `test@paridaderisco.com`
- ✅ **Cestas**: "Risky Parity" e "Risky Parity Original"
- ✅ **Transações**: Histórico de compras reais
- ✅ **Dados**: 5+ anos de histórico de preços

## 🚨 Troubleshooting

### Erro: "Asset not found for ticker"
```
⚠️ Asset not found for ticker: SOME_TICKER
```
**Solução**: Verificar se todos os tickers referenciados existem nos ativos.

### Erro: "Database connection"
```
❌ Seed failed: PrismaClientKnownRequestError
```
**Solução**: 
1. Verificar `DATABASE_URL` no `.env`
2. Certificar que PostgreSQL está rodando
3. Executar `npm run db:push` primeiro

### Performance Lenta
```
📊 Processing 13,065 historical records...
```
**Normal**: Dados históricos são processados em batches de 1000 registros.

## 📈 Próximos Passos

Após a migração bem-sucedida:

1. **Testar APIs** - Verificar se as queries tRPC funcionam
2. **Validar UI** - Testar dashboard com dados reais
3. **Performance** - Monitorar queries com dados volumosos
4. **Backup** - Fazer snapshot da base populada

## 🎯 Comandos Úteis

```bash
# Ver logs detalhados do seed
npm run db:seed 2>&1 | tee migration.log

# Verificar schema aplicado
npx prisma db pull

# Abrir interface visual
npm run db:studio

# Reset para estado limpo
npm run db:reset
```

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no console
2. Conferir integridade dos arquivos JSON
3. Validar schema Prisma atualizado
4. Consultar esta documentação

---
*Migração criada por John (Product Manager) - Épico 1 Modernização*