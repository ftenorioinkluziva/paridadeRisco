import { prisma } from '~/lib/prisma';
import { generateEmbedding } from './embeddings';
import { Prisma } from '@prisma/client';

export interface SimilarityResult {
  id: string;
  content: string;
  similarity: number;
  resource: {
    id: string;
    title: string;
    category: string;
  };
}

/**
 * Busca conteúdo relevante baseado em uma pergunta usando similaridade vetorial
 */
export async function findRelevantContent(
  question: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
    category?: string;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit ?? 4;
  const similarityThreshold = options?.similarityThreshold ?? 0.5;

  try {
    // Gerar embedding para a pergunta
    const questionEmbedding = await generateEmbedding(question);

    // Converter embedding para string formatada para PostgreSQL
    const embeddingString = `[${questionEmbedding.join(',')}]`;

    // Query SQL bruto para busca por similaridade usando pgvector
    // Usando cosine distance (1 - cosine_similarity)
    // Quanto menor a distância, mais similar
    let query = Prisma.sql`
      SELECT
        e.id,
        e.content,
        e."resourceId",
        r.title,
        r.category,
        1 - (e.embedding <=> ${embeddingString}::vector) as similarity
      FROM "Embedding" e
      JOIN "Resource" r ON e."resourceId" = r.id
    `;

    // Construir WHERE clause
    const whereConditions = [];

    if (options?.category) {
      whereConditions.push(Prisma.sql`r.category::text = ${options.category}`);
    }

    whereConditions.push(Prisma.sql`1 - (e.embedding <=> ${embeddingString}::vector) > ${similarityThreshold}`);

    // Adicionar WHERE com todas as condições
    query = Prisma.sql`
      ${query}
      WHERE ${Prisma.join(whereConditions, ' AND ')}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    // Executar query
    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        resourceId: string;
        title: string;
        category: string;
        similarity: number;
      }>
    >(query);

    // Formatar resultados
    return results.map((row) => ({
      id: row.id,
      content: row.content,
      similarity: Number(row.similarity),
      resource: {
        id: row.resourceId,
        title: row.title,
        category: row.category,
      },
    }));
  } catch (error) {
    console.error('Error finding relevant content:', error);
    throw new Error('Failed to search for relevant content');
  }
}

/**
 * Busca recursos similares a um texto dado
 * Útil para encontrar duplicatas ou conteúdo relacionado ao adicionar novos recursos
 */
export async function findSimilarResources(
  text: string,
  options?: {
    limit?: number;
    excludeResourceId?: string;
  }
): Promise<SimilarityResult[]> {
  const limit = options?.limit ?? 5;

  try {
    const embedding = await generateEmbedding(text);
    const embeddingString = `[${embedding.join(',')}]`;

    let query = Prisma.sql`
      SELECT
        e.id,
        e.content,
        e."resourceId",
        r.title,
        r.category,
        1 - (e.embedding <=> ${embeddingString}::vector) as similarity
      FROM "Embedding" e
      JOIN "Resource" r ON e."resourceId" = r.id
    `;

    // Excluir recurso específico se fornecido
    if (options?.excludeResourceId) {
      query = Prisma.sql`
        ${query}
        WHERE r.id != ${options.excludeResourceId}
      `;
    }

    query = Prisma.sql`
      ${query}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        resourceId: string;
        title: string;
        category: string;
        similarity: number;
      }>
    >(query);

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      similarity: Number(row.similarity),
      resource: {
        id: row.resourceId,
        title: row.title,
        category: row.category,
      },
    }));
  } catch (error) {
    console.error('Error finding similar resources:', error);
    throw new Error('Failed to find similar resources');
  }
}

/**
 * Formata resultados de busca para exibição ao usuário ou ao LLM
 */
export function formatSearchResults(results: SimilarityResult[]): string {
  if (results.length === 0) {
    return 'Nenhuma informação relevante encontrada na base de conhecimento.';
  }

  return results
    .map((result, index) => {
      return `
[${index + 1}] ${result.resource.title} (${result.resource.category})
Similaridade: ${(result.similarity * 100).toFixed(1)}%
---
${result.content}
`;
    })
    .join('\n\n');
}

/**
 * Exemplo de uso:
 *
 * const results = await findRelevantContent(
 *   "Como rebalancear meu portfólio?",
 *   {
 *     limit: 3,
 *     similarityThreshold: 0.7,
 *     category: "RISK_PARITY"
 *   }
 * );
 *
 * const formatted = formatSearchResults(results);
 * console.log(formatted);
 */
