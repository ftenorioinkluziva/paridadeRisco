import { PrismaClient, AssetCalculationType, TransactionType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Interfaces para dados legados
interface LegacyAtivo {
  id: number;
  ticker: string;
  nome: string;
  preco_atual: number;
  retorno_acumulado: number;
  retorno_anualizado: number;
  volatilidade: number;
  max_drawdown: number;
  sharpe: number;
  data_atualizacao: string;
}

interface LegacyCesta {
  id: number;
  nome: string;
  descricao: string;
  ativos: { [ticker: string]: number };
  data_criacao: string;
  data_atualizacao: string;
}

interface LegacyTransacao {
  id: number;
  type: 'buy' | 'sell';
  ativo_id: number;
  quantity: number;
  price: number;
  date: string;
  totalvalue: number;
  created_at: string;
}

interface LegacyDadoHistorico {
  id: number;
  ticker: string;
  nome_ativo: string;
  data: string;
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  retorno_diario: number;
  mm20?: number;
  bb2s?: number;
  bb2i?: number;
}

interface LegacyCashBalance {
  id: number;
  value: number;
  last_update: string;
}

interface LegacyFundoInvestimento {
  id: number;
  name: string;
  initial_investment: number;
  current_value: number;
  investment_date: string;
  created_at: string;
  updated_at: string;
}

// Mapeamento de IDs legados para novos CUIDs
const ativoIdMap: { [legacyId: number]: string } = {};

function inferAssetType(ticker: string): string {
  if (ticker === 'CDI') return 'Fixed Income';
  if (ticker.includes('USD')) return 'Currency';
  if (ticker.includes('.SA')) {
    if (ticker.includes('11')) return 'ETF';
    return 'Stock';
  }
  return 'Other';
}

function inferCalculationType(ticker: string): AssetCalculationType {
  if (ticker === 'CDI') return AssetCalculationType.PERCENTUAL;
  return AssetCalculationType.PRECO;
}

async function loadJsonData<T>(filename: string): Promise<T[]> {
  const dataPath = path.join(process.cwd(), '..', 'migration', 'migration', 'data', filename);
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(fileContent);
}

async function seedUser() {
  console.log('🧑‍💼 Creating test user...');
  
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@paridaderisco.com',
      phone: '+55 11 99999-9999',
      password: '$2b$10$n7RFAFQ/onht2b9noGkJq.5o6KetGk50BADGv67WhsiNjhWurLsxS', // Hash of "password123"
    },
  });
  
  console.log(`✅ User created: ${user.id}`);
  return user;
}

async function seedAtivos() {
  console.log('📈 Migrating assets...');
  
  const legacyAtivos = await loadJsonData<LegacyAtivo>('ativos.json');
  
  const ativos = [];
  for (const legacy of legacyAtivos) {
    const ativo = await prisma.ativo.create({
      data: {
        ticker: legacy.ticker,
        name: legacy.nome,
        type: inferAssetType(legacy.ticker),
        calculationType: inferCalculationType(legacy.ticker),
      },
    });
    
    ativoIdMap[legacy.id] = ativo.id;
    ativos.push(ativo);
    console.log(`  ✅ ${legacy.ticker} -> ${ativo.id}`);
  }
  
  console.log(`✅ ${ativos.length} assets migrated`);
  return ativos;
}

async function seedDadosHistoricos() {
  console.log('📊 Migrating historical data...');
  
  const legacyDados = await loadJsonData<LegacyDadoHistorico>('dados_historicos.json');
  console.log(`  Processing ${legacyDados.length} historical records...`);
  
  // Batch processing para performance
  const batchSize = 1000;
  let processedCount = 0;
  
  for (let i = 0; i < legacyDados.length; i += batchSize) {
    const batch = legacyDados.slice(i, i + batchSize);
    
    const dadosToInsert = await Promise.all(
      batch.map(async (legacy) => {
        // Encontrar o ativo pelo ticker
        const ativo = await prisma.ativo.findUnique({
          where: { ticker: legacy.ticker }
        });
        
        if (!ativo) {
          console.warn(`  ⚠️ Asset not found for ticker: ${legacy.ticker}`);
          return null;
        }
        
        return {
          date: new Date(legacy.data),
          price: legacy.fechamento,
          ativoId: ativo.id,
        };
      })
    );
    
    const validDados = dadosToInsert.filter((dado): dado is NonNullable<typeof dado> => dado !== null);
    
    try {
      await prisma.dadoHistorico.createMany({
        data: validDados,
        skipDuplicates: true,
      });
      
      processedCount += validDados.length;
      console.log(`  📈 Batch ${Math.floor(i/batchSize) + 1}: ${validDados.length} records`);
    } catch (error) {
      console.error(`  ❌ Batch error:`, error);
    }
  }
  
  console.log(`✅ ${processedCount} historical records migrated`);
}

async function seedCestas(userId: string) {
  console.log('🗂️ Migrating baskets...');
  
  const legacyCestas = await loadJsonData<LegacyCesta>('cestas.json');
  
  for (const legacy of legacyCestas) {
    // Criar a cesta
    const cesta = await prisma.cesta.create({
      data: {
        name: legacy.nome,
        userId: userId,
      },
    });
    
    console.log(`  📂 Created basket: ${legacy.nome}`);
    
    // Adicionar ativos à cesta
    for (const [ticker, percentage] of Object.entries(legacy.ativos)) {
      const ativo = await prisma.ativo.findUnique({
        where: { ticker }
      });
      
      if (ativo) {
        await prisma.ativosEmCestas.create({
          data: {
            cestaId: cesta.id,
            ativoId: ativo.id,
            targetPercentage: percentage,
          },
        });
        console.log(`    ✅ ${ticker}: ${percentage}%`);
      } else {
        console.warn(`    ⚠️ Asset not found: ${ticker}`);
      }
    }
  }
  
  console.log('✅ All baskets migrated');
}

async function seedTransacoes(userId: string) {
  console.log('💰 Migrating transactions...');
  
  const legacyTransacoes = await loadJsonData<LegacyTransacao>('transacoes.json');
  
  for (const legacy of legacyTransacoes) {
    // Encontrar o novo ID do ativo
    const ativoId = ativoIdMap[legacy.ativo_id];
    
    if (!ativoId) {
      console.warn(`  ⚠️ Asset ID not found: ${legacy.ativo_id}`);
      continue;
    }
    
    await prisma.transacao.create({
      data: {
        type: legacy.type === 'buy' ? TransactionType.COMPRA : TransactionType.VENDA,
        shares: legacy.quantity,
        pricePerShare: legacy.price,
        date: new Date(legacy.date),
        ativoId: ativoId,
        userId: userId,
      },
    });
    
    console.log(`  💸 ${legacy.type} ${legacy.quantity} @ $${legacy.price}`);
  }
  
  console.log(`✅ ${legacyTransacoes.length} transactions migrated`);
}

async function seedPortfolio(userId: string) {
  console.log('💼 Creating portfolio...');
  
  const legacyCashBalance = await loadJsonData<LegacyCashBalance>('cash_balance.json');
  const cashBalance = legacyCashBalance[0]?.value || 0;
  
  await prisma.portfolio.create({
    data: {
      userId: userId,
      cashBalance: cashBalance,
    },
  });
  
  console.log(`✅ Portfolio created with cash balance: $${cashBalance}`);
}

async function seedFundosInvestimento(userId: string) {
  console.log('🏦 Migrating investment funds...');
  
  const legacyFundos = await loadJsonData<LegacyFundoInvestimento>('investment_funds.json');
  
  for (const legacy of legacyFundos) {
    await prisma.fundoInvestimento.create({
      data: {
        name: legacy.name,
        initialInvestment: legacy.initial_investment,
        currentValue: legacy.current_value,
        investmentDate: new Date(legacy.investment_date),
        userId: userId,
      },
    });
    
    const rentabilidade = ((legacy.current_value - legacy.initial_investment) / legacy.initial_investment) * 100;
    console.log(`  🏦 ${legacy.name}: R$${legacy.initial_investment.toFixed(2)} → R$${legacy.current_value.toFixed(2)} (+${rentabilidade.toFixed(2)}%)`);
  }
  
  console.log(`✅ ${legacyFundos.length} investment funds migrated`);
}

async function main() {
  console.log('🚀 Starting ParidadeRisco database seed...');
  
  try {
    // Limpar dados existentes (cuidado em produção!)
    console.log('🧹 Cleaning existing data...');
    await prisma.dadoHistorico.deleteMany({});
    await prisma.ativosEmCestas.deleteMany({});
    await prisma.transacao.deleteMany({});
    await prisma.fundoInvestimento.deleteMany({});
    await prisma.cesta.deleteMany({});
    await prisma.portfolio.deleteMany({});
    await prisma.ativo.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Executar migração em ordem
    const user = await seedUser();
    await seedAtivos();
    await seedDadosHistoricos();
    await seedCestas(user.id);
    await seedTransacoes(user.id);
    await seedFundosInvestimento(user.id);
    await seedPortfolio(user.id);
    
    console.log('🎉 Seed completed successfully!');
    
    // Estatísticas finais
    const stats = {
      users: await prisma.user.count(),
      ativos: await prisma.ativo.count(),
      dadosHistoricos: await prisma.dadoHistorico.count(),
      cestas: await prisma.cesta.count(),
      transacoes: await prisma.transacao.count(),
      fundosInvestimento: await prisma.fundoInvestimento.count(),
      portfolios: await prisma.portfolio.count(),
    };
    
    console.log('\n📊 Final Statistics:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();