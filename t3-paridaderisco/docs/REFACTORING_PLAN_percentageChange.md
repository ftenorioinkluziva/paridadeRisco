# Plano de Refatoração: Remoção do campo `percentageChange`

## 📋 Objetivo
Remover o campo `percentageChange` da tabela `DadoHistorico` e calcular esse valor dinamicamente quando necessário, mantendo apenas o campo `price`.

## 🎯 Justificativa
- **Redução de Redundância**: `percentageChange` pode ser calculado a partir dos preços
- **Economia de Espaço**: Menos dados armazenados no banco
- **Consistência**: Evita valores calculados incorretamente salvos no banco
- **Manutenibilidade**: Cálculo centralizado em uma função utilitária

---

## 📊 Análise de Impacto

### Arquivos Afetados (18 arquivos encontrados):

#### 🔴 **CRÍTICO - Necessita Modificação**
1. `prisma/schema.prisma` - Schema do banco
2. `src/server/services/financialDataFetcher.ts` - Inserção de dados
3. `src/server/api/routers/asset.ts` - API de ativos
4. `src/server/api/routers/cesta.ts` - API de cestas
5. `src/server/api/routers/charts.ts` - API de gráficos
6. `src/server/api/routers/retirement.ts` - API de aposentadoria
7. `src/features/charts/types/charts.ts` - Tipos TypeScript
8. `src/features/charts/utils/calculations.ts` - Cálculos de gráficos

#### 🟡 **MODERADO - Ajustes Necessários**
9. `src/features/charts/components/TimeSeriesChart.tsx` - Componente de gráfico
10. `prisma/seed.ts` - Seed do banco
11. `src/server/services/migrate-database.ts` - Migração de dados

#### 🟢 **BAIXO - Testes e Documentação**
12. `src/server/services/financialDataFetcher.test.ts` - Testes
13. `src/server/api/routers/asset.test.ts` - Testes
14. `src/lib/prisma.test.ts` - Testes
15. `src/__tests__/integration/portfolio.test.ts` - Testes
16. `MIGRATION_GUIDE.md` - Documentação

---

## 🔧 Plano de Implementação

### **FASE 1: Criar Função Utilitária**

#### Arquivo: `src/lib/utils/priceCalculations.ts` (NOVO)
```typescript
/**
 * Calcula a variação percentual entre dois preços
 * @param previousPrice Preço anterior
 * @param currentPrice Preço atual
 * @returns Variação percentual (ex: 2.5 para 2.5%)
 */
export function calculatePercentageChange(
  previousPrice: number | null,
  currentPrice: number | null
): number | null {
  if (
    previousPrice === null ||
    currentPrice === null ||
    previousPrice === 0
  ) {
    return null;
  }

  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Adiciona percentageChange calculado a um array de dados históricos
 * @param data Array de dados com price e date
 * @returns Array com percentageChange calculado
 */
export function addPercentageChangeToData<T extends { price: number | null }>(
  data: T[]
): (T & { percentageChange: number | null })[] {
  if (data.length === 0) return [];

  return data.map((item, index) => {
    if (index === 0) {
      return { ...item, percentageChange: null };
    }

    const previousPrice = data[index - 1]?.price ?? null;
    const percentageChange = calculatePercentageChange(previousPrice, item.price);

    return { ...item, percentageChange };
  });
}

/**
 * Calcula percentageChange para dados agrupados por ativo
 * Útil para cestas e comparações
 */
export function addPercentageChangeByAsset<T extends { price: number | null; ativoId: string }>(
  data: T[]
): (T & { percentageChange: number | null })[] {
  // Agrupar por ativo
  const byAsset = data.reduce((acc, item) => {
    if (!acc[item.ativoId]) {
      acc[item.ativoId] = [];
    }
    acc[item.ativoId].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  // Calcular percentageChange por ativo
  const result: (T & { percentageChange: number | null })[] = [];

  for (const ativoId in byAsset) {
    const assetData = byAsset[ativoId];
    const withPercentage = addPercentageChangeToData(assetData);
    result.push(...withPercentage);
  }

  return result;
}
```

---

### **FASE 2: Modificar Schema Prisma**

#### Arquivo: `prisma/schema.prisma`

**ANTES:**
```prisma
model DadoHistorico {
  id               String    @id @default(cuid())
  date             DateTime
  price            Decimal?  @db.Decimal(10, 2)
  percentageChange Decimal?  @db.Decimal(10, 4)
  ativoId          String
  ativo            Ativo     @relation(fields: [ativoId], references: [id])

  @@unique([ativoId, date])
}
```

**DEPOIS:**
```prisma
model DadoHistorico {
  id      String    @id @default(cuid())
  date    DateTime
  price   Decimal?  @db.Decimal(10, 2)
  ativoId String
  ativo   Ativo     @relation(fields: [ativoId], references: [id])

  @@unique([ativoId, date])
}
```

**Comandos:**
```bash
# Criar migration
npx prisma migrate dev --name remove_percentage_change_from_dado_historico

# Aplicar no banco
npx prisma migrate deploy
```

---

### **FASE 3: Atualizar financialDataFetcher.ts**

#### Modificações necessárias:

1. **Remover cálculo de percentageChange nas funções:**
   - `fetchYahooFinanceData` (linhas ~159-182)
   - `fetchCryptoData` (linhas ~235-258)
   - `fetchIPCAData` (linhas ~306-333)
   - `fetchIPCAExpectativaData` (linhas ~378-442)
   - `fetchBCBData` (linhas ~462-549)

2. **Remover do upsert:**
```typescript
// ANTES
await prisma.dadoHistorico.upsert({
  where: { ativoId_date: { ativoId: asset.id, date: dataPoint.date } },
  update: {
    price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
    percentageChange: dataPoint.percentageChange ? parseFloat(dataPoint.percentageChange.toFixed(4)) : null,
  },
  create: {
    ativoId: asset.id,
    date: dataPoint.date,
    price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
    percentageChange: dataPoint.percentageChange ? parseFloat(dataPoint.percentageChange.toFixed(4)) : null,
  },
});

// DEPOIS
await prisma.dadoHistorico.upsert({
  where: { ativoId_date: { ativoId: asset.id, date: dataPoint.date } },
  update: {
    price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
  },
  create: {
    ativoId: asset.id,
    date: dataPoint.date,
    price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
  },
});
```

3. **Modificar tipo de retorno:**
```typescript
// ANTES
historicalData.push({
  date: recordDate,
  price,
  percentageChange,
});

// DEPOIS
historicalData.push({
  date: recordDate,
  price,
});
```

---

### **FASE 4: Atualizar APIs tRPC**

#### `src/server/api/routers/asset.ts`

**Modificar query `getHistoricalData`:**
```typescript
// ANTES
const historicalData = await ctx.prisma.dadoHistorico.findMany({
  where: { ativoId: input.ticker },
  orderBy: { date: "asc" },
  select: { date: true, price: true, percentageChange: true },
});

// DEPOIS
import { addPercentageChangeToData } from "~/lib/utils/priceCalculations";

const historicalDataRaw = await ctx.prisma.dadoHistorico.findMany({
  where: { ativoId: input.ticker },
  orderBy: { date: "asc" },
  select: { date: true, price: true },
});

// Calcular percentageChange dinamicamente
const historicalData = addPercentageChangeToData(
  historicalDataRaw.map(d => ({
    ...d,
    price: d.price ? Number(d.price) : null
  }))
);
```

#### `src/server/api/routers/charts.ts`

Similar ao asset.ts, adicionar cálculo dinâmico:
```typescript
import { addPercentageChangeToData } from "~/lib/utils/priceCalculations";

// Em getTimeSeriesData:
const dataWithPercentage = addPercentageChangeToData(
  rawData.map(d => ({ ...d, price: Number(d.price) }))
);
```

#### `src/server/api/routers/cesta.ts`

Não precisa modificar - usa apenas `price` para cálculos de retorno.

#### `src/server/api/routers/retirement.ts`

Verificar se usa `percentageChange` - provavelmente não.

---

### **FASE 5: Atualizar Types TypeScript**

#### `src/features/charts/types/charts.ts`

```typescript
// ANTES
export interface HistoricalDataPoint {
  date: Date;
  price: number | null;
  percentageChange?: number | null;
}

// DEPOIS - Manter para compatibilidade, mas marcar como calculado
export interface HistoricalDataPoint {
  date: Date;
  price: number | null;
  percentageChange?: number | null; // Calculado dinamicamente, não vem do banco
}
```

---

### **FASE 6: Atualizar seed.ts**

#### `prisma/seed.ts`

```typescript
// ANTES
await prisma.dadoHistorico.createMany({
  data: validDados.map(d => ({
    date: d.date,
    price: d.price,
    percentageChange: d.percentageChange,
    ativoId: d.ativoId,
  })),
  skipDuplicates: true,
});

// DEPOIS
await prisma.dadoHistorico.createMany({
  data: validDados.map(d => ({
    date: d.date,
    price: d.price,
    ativoId: d.ativoId,
  })),
  skipDuplicates: true,
});
```

---

### **FASE 7: Atualizar migrate-database.ts**

Remover `percentageChange` do processo de migração.

---

### **FASE 8: Atualizar Testes**

Modificar todos os testes que mocam `percentageChange`:
- `financialDataFetcher.test.ts`
- `asset.test.ts`
- `prisma.test.ts`
- `portfolio.test.ts`

---

## 🚀 Ordem de Execução

### 1️⃣ **PREPARAÇÃO (Sem Breaking Changes)**
- ✅ Criar `src/lib/utils/priceCalculations.ts`
- ✅ Testar função utilitária isoladamente

### 2️⃣ **ADAPTAÇÃO DO CÓDIGO**
- ✅ Atualizar APIs tRPC para calcular percentageChange dinamicamente
- ✅ Modificar financialDataFetcher para não salvar percentageChange
- ✅ Atualizar seed.ts e migrate-database.ts
- ✅ Rodar testes e corrigir erros

### 3️⃣ **MIGRATION DO BANCO**
- ✅ Modificar `schema.prisma`
- ✅ Gerar migration: `npx prisma migrate dev`
- ✅ Aplicar migration: `npx prisma migrate deploy`

### 4️⃣ **VALIDAÇÃO**
- ✅ Testar todas as funcionalidades
- ✅ Verificar gráficos e relatórios
- ✅ Confirmar que percentageChange é calculado corretamente

---

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de dados históricos
**Mitigação**: Fazer backup do banco antes da migration
```bash
pg_dump -h localhost -U postgres paridaderisco > backup_before_refactoring.sql
```

### Risco 2: Performance degradada
**Mitigação**:
- Calcular percentageChange apenas quando necessário
- Usar memoização no frontend se necessário
- Considerar índices no banco para queries de price

### Risco 3: Breaking changes em produção
**Mitigação**:
- Testar localmente primeiro
- Deploy gradual (feature flag se necessário)
- Rollback plan preparado

---

## 📈 Benefícios Esperados

1. **Redução de ~25% no tamanho da tabela DadoHistorico**
2. **Eliminação de inconsistências** entre price e percentageChange
3. **Código mais limpo** com cálculo centralizado
4. **Facilita correções futuras** nos cálculos

---

## ✅ Checklist Final

- [ ] Função utilitária criada e testada
- [ ] Todos os usos de percentageChange mapeados
- [ ] APIs atualizadas para calcular dinamicamente
- [ ] financialDataFetcher não salva mais percentageChange
- [ ] Schema Prisma atualizado
- [ ] Migration criada e testada
- [ ] Testes atualizados e passando
- [ ] Backup do banco realizado
- [ ] Deploy em staging testado
- [ ] Deploy em produção realizado
- [ ] Monitoramento de performance ativo

---

## 📞 Contato para Dúvidas

Se houver dúvidas durante a implementação, revisar:
1. Este documento
2. Código da função `calculatePercentageChange`
3. Exemplos de uso nas APIs

---

**Data de Criação**: 2025-11-13
**Autor**: Refatoração solicitada pelo usuário
**Status**: 📋 Planejamento Completo - Pronto para Implementação
