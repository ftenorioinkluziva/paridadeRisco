/**
 * Script de migração de dados entre bancos PostgreSQL
 *
 * Este script:
 * 1. Exporta todos os dados do banco de dados antigo
 * 2. Importa os dados para o novo banco Neon
 *
 * Uso: npx tsx src/server/services/migrate-database.ts
 */

import { PrismaClient } from '@prisma/client';

// Banco de dados antigo (origem)
const OLD_DATABASE_URL = "postgresql://postgres:chemical@localhost:5432/paridaderisco_t3";

// Banco de dados novo (destino) - Neon
const NEW_DATABASE_URL = "postgresql://neondb_owner:npg_3cDUb2ihLJQG@ep-steep-term-admfsqey-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: OLD_DATABASE_URL,
    },
  },
});

const newDb = new PrismaClient({
  datasources: {
    db: {
      url: NEW_DATABASE_URL,
    },
  },
});

interface MigrationData {
  users: any[];
  portfolios: any[];
  ativos: any[];
  cestas: any[];
  ativosEmCestas: any[];
  dadosHistoricos: any[];
  transacoes: any[];
  fundosInvestimento: any[];
}

async function exportData(): Promise<MigrationData> {
  console.log('📤 Exportando dados do banco antigo...');

  const users = await oldDb.user.findMany();
  console.log(`  ✓ ${users.length} usuários exportados`);

  const portfolios = await oldDb.portfolio.findMany();
  console.log(`  ✓ ${portfolios.length} portfolios exportados`);

  const ativos = await oldDb.ativo.findMany();
  console.log(`  ✓ ${ativos.length} ativos exportados`);

  const cestas = await oldDb.cesta.findMany();
  console.log(`  ✓ ${cestas.length} cestas exportadas`);

  const ativosEmCestas = await oldDb.ativosEmCestas.findMany();
  console.log(`  ✓ ${ativosEmCestas.length} relações ativo-cesta exportadas`);

  const dadosHistoricos = await oldDb.dadoHistorico.findMany();
  console.log(`  ✓ ${dadosHistoricos.length} dados históricos exportados`);

  const transacoes = await oldDb.transacao.findMany();
  console.log(`  ✓ ${transacoes.length} transações exportadas`);

  const fundosInvestimento = await oldDb.fundoInvestimento.findMany();
  console.log(`  ✓ ${fundosInvestimento.length} fundos de investimento exportados`);

  return {
    users,
    portfolios,
    ativos,
    cestas,
    ativosEmCestas,
    dadosHistoricos,
    transacoes,
    fundosInvestimento,
  };
}

async function importData(data: MigrationData): Promise<void> {
  console.log('\n📥 Importando dados para o novo banco...');

  // 1. Importar usuários
  console.log('  → Importando usuários...');
  for (const user of data.users) {
    await newDb.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
  console.log(`  ✓ ${data.users.length} usuários importados`);

  // 2. Importar portfolios
  console.log('  → Importando portfolios...');
  for (const portfolio of data.portfolios) {
    await newDb.portfolio.create({
      data: {
        id: portfolio.id,
        cashBalance: portfolio.cashBalance,
        userId: portfolio.userId,
      },
    });
  }
  console.log(`  ✓ ${data.portfolios.length} portfolios importados`);

  // 3. Importar ativos
  console.log('  → Importando ativos...');
  for (const ativo of data.ativos) {
    await newDb.ativo.create({
      data: {
        id: ativo.id,
        ticker: ativo.ticker,
        name: ativo.name,
        type: ativo.type,
        calculationType: ativo.calculationType,
      },
    });
  }
  console.log(`  ✓ ${data.ativos.length} ativos importados`);

  // 4. Importar cestas
  console.log('  → Importando cestas...');
  for (const cesta of data.cestas) {
    await newDb.cesta.create({
      data: {
        id: cesta.id,
        name: cesta.name,
        userId: cesta.userId,
      },
    });
  }
  console.log(`  ✓ ${data.cestas.length} cestas importadas`);

  // 5. Importar relações ativo-cesta
  console.log('  → Importando relações ativo-cesta...');
  for (const ativoEmCesta of data.ativosEmCestas) {
    await newDb.ativosEmCestas.create({
      data: {
        cestaId: ativoEmCesta.cestaId,
        ativoId: ativoEmCesta.ativoId,
        targetPercentage: ativoEmCesta.targetPercentage,
      },
    });
  }
  console.log(`  ✓ ${data.ativosEmCestas.length} relações importadas`);

  // 6. Importar dados históricos (em lotes para melhor performance)
  console.log('  → Importando dados históricos...');
  const batchSize = 1000;
  for (let i = 0; i < data.dadosHistoricos.length; i += batchSize) {
    const batch = data.dadosHistoricos.slice(i, i + batchSize);
    await newDb.dadoHistorico.createMany({
      data: batch.map(dado => ({
        id: dado.id,
        date: dado.date,
        price: dado.price,
        ativoId: dado.ativoId,
      })),
      skipDuplicates: true,
    });
    console.log(`    ✓ ${Math.min(i + batchSize, data.dadosHistoricos.length)}/${data.dadosHistoricos.length} dados históricos importados`);
  }
  console.log(`  ✓ ${data.dadosHistoricos.length} dados históricos importados`);

  // 7. Importar transações
  console.log('  → Importando transações...');
  for (const transacao of data.transacoes) {
    await newDb.transacao.create({
      data: {
        id: transacao.id,
        type: transacao.type,
        shares: transacao.shares,
        pricePerShare: transacao.pricePerShare,
        date: transacao.date,
        ativoId: transacao.ativoId,
        userId: transacao.userId,
      },
    });
  }
  console.log(`  ✓ ${data.transacoes.length} transações importadas`);

  // 8. Importar fundos de investimento
  console.log('  → Importando fundos de investimento...');
  for (const fundo of data.fundosInvestimento) {
    await newDb.fundoInvestimento.create({
      data: {
        id: fundo.id,
        name: fundo.name,
        initialInvestment: fundo.initialInvestment,
        currentValue: fundo.currentValue,
        investmentDate: fundo.investmentDate,
        createdAt: fundo.createdAt,
        updatedAt: fundo.updatedAt,
        userId: fundo.userId,
        indiceId: fundo.indiceId,
      },
    });
  }
  console.log(`  ✓ ${data.fundosInvestimento.length} fundos de investimento importados`);
}

async function verifyData(data: MigrationData): Promise<void> {
  console.log('\n🔍 Verificando integridade dos dados migrados...');

  const usersCount = await newDb.user.count();
  console.log(`  Users: ${usersCount}/${data.users.length} ${usersCount === data.users.length ? '✓' : '✗'}`);

  const portfoliosCount = await newDb.portfolio.count();
  console.log(`  Portfolios: ${portfoliosCount}/${data.portfolios.length} ${portfoliosCount === data.portfolios.length ? '✓' : '✗'}`);

  const ativosCount = await newDb.ativo.count();
  console.log(`  Ativos: ${ativosCount}/${data.ativos.length} ${ativosCount === data.ativos.length ? '✓' : '✗'}`);

  const cestasCount = await newDb.cesta.count();
  console.log(`  Cestas: ${cestasCount}/${data.cestas.length} ${cestasCount === data.cestas.length ? '✓' : '✗'}`);

  const ativosEmCestasCount = await newDb.ativosEmCestas.count();
  console.log(`  Ativos em Cestas: ${ativosEmCestasCount}/${data.ativosEmCestas.length} ${ativosEmCestasCount === data.ativosEmCestas.length ? '✓' : '✗'}`);

  const dadosHistoricosCount = await newDb.dadoHistorico.count();
  console.log(`  Dados Históricos: ${dadosHistoricosCount}/${data.dadosHistoricos.length} ${dadosHistoricosCount === data.dadosHistoricos.length ? '✓' : '✗'}`);

  const transacoesCount = await newDb.transacao.count();
  console.log(`  Transações: ${transacoesCount}/${data.transacoes.length} ${transacoesCount === data.transacoes.length ? '✓' : '✗'}`);

  const fundosCount = await newDb.fundoInvestimento.count();
  console.log(`  Fundos de Investimento: ${fundosCount}/${data.fundosInvestimento.length} ${fundosCount === data.fundosInvestimento.length ? '✓' : '✗'}`);

  const allCorrect =
    usersCount === data.users.length &&
    portfoliosCount === data.portfolios.length &&
    ativosCount === data.ativos.length &&
    cestasCount === data.cestas.length &&
    ativosEmCestasCount === data.ativosEmCestas.length &&
    dadosHistoricosCount === data.dadosHistoricos.length &&
    transacoesCount === data.transacoes.length &&
    fundosCount === data.fundosInvestimento.length;

  if (allCorrect) {
    console.log('\n✅ Todos os dados foram migrados com sucesso!');
  } else {
    console.log('\n⚠️  Atenção: Alguns dados podem não ter sido migrados corretamente.');
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migração de banco de dados...\n');
    console.log(`📍 Origem: ${OLD_DATABASE_URL.split('@')[1]}`);
    console.log(`📍 Destino: ${NEW_DATABASE_URL.split('@')[1]?.split('?')[0]}\n`);

    // Testar conexão com banco antigo
    console.log('🔌 Testando conexão com banco antigo...');
    await oldDb.$connect();
    console.log('  ✓ Conectado ao banco antigo\n');

    // Testar conexão com banco novo
    console.log('🔌 Testando conexão com banco novo...');
    await newDb.$connect();
    console.log('  ✓ Conectado ao banco novo\n');

    // Exportar dados
    const data = await exportData();

    // Importar dados
    await importData(data);

    // Verificar integridade
    await verifyData(data);

    console.log('\n✨ Migração concluída!\n');

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

main();
