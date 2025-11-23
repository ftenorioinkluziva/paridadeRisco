import { embed, embedMany } from 'ai';
import { getEmbeddingModel } from './config';
import { chunkText } from './chunking';

/**
 * Gera embedding para um único texto
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input for embedding generation');
  }

  const embeddingModel = getEmbeddingModel();

  const { embedding } = await embed({
    model: embeddingModel,
    value: text.replaceAll('\n', ' '),
  });

  return embedding;
}

/**
 * Gera embeddings para múltiplos textos em batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddingModel = getEmbeddingModel();

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });

  return embeddings;
}

/**
 * Processa um texto longo: faz chunking e gera embeddings para cada chunk
 */
export async function processTextForEmbedding(
  text: string,
  options?: {
    maxChunkSize?: number;
    overlap?: number;
  }
): Promise<Array<{ content: string; embedding: number[] }>> {
  // Dividir texto em chunks
  const chunks = chunkText(text, options);

  // Gerar embeddings para todos os chunks em batch
  const embeddings = await generateEmbeddings(chunks);

  // Combinar chunks com seus embeddings
  return chunks.map((content, index) => ({
    content,
    embedding: embeddings[index] ?? [],
  }));
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 * Retorna um valor entre -1 e 1, onde 1 significa vetores idênticos
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i]! * vecB[i]!;
    normA += vecA[i]! * vecA[i]!;
    normB += vecB[i]! * vecB[i]!;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Converte array de números para string formatada para PostgreSQL vector
 */
export function formatVectorForPostgres(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

/**
 * Parse string vector do PostgreSQL para array de números
 */
export function parseVectorFromPostgres(vectorString: string): number[] {
  // Remove os colchetes e divide por vírgula
  const cleaned = vectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map(Number);
}

/**
 * Exemplo de uso:
 *
 * // Processar um artigo completo
 * const article = "Seu artigo sobre paridade de risco...";
 * const chunksWithEmbeddings = await processTextForEmbedding(article);
 *
 * // Salvar no banco de dados
 * for (const chunk of chunksWithEmbeddings) {
 *   await prisma.embedding.create({
 *     data: {
 *       resourceId: resourceId,
 *       content: chunk.content,
 *       embedding: formatVectorForPostgres(chunk.embedding),
 *     },
 *   });
 * }
 */
