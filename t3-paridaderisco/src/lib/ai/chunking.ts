/**
 * Funções para dividir texto em chunks menores para melhor qualidade de embeddings
 */

interface ChunkOptions {
  maxChunkSize?: number; // Tamanho máximo de cada chunk em caracteres
  overlap?: number; // Sobreposição entre chunks para manter contexto
  splitBySentence?: boolean; // Se deve dividir por sentença
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1000, // ~200-250 tokens
  overlap: 100, // ~20-25 tokens de overlap
  splitBySentence: true,
};

/**
 * Divide texto por sentenças usando regex
 */
function splitIntoSentences(text: string): string[] {
  // Regex para dividir por pontuação final mantendo o contexto
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex);

  if (!sentences) {
    return [text];
  }

  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Divide texto em chunks menores
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Normalizar espaços em branco
  const normalizedText = text.trim().replace(/\s+/g, ' ');

  if (normalizedText.length <= opts.maxChunkSize) {
    return [normalizedText];
  }

  const chunks: string[] = [];

  if (opts.splitBySentence) {
    // Dividir por sentenças primeiro
    const sentences = splitIntoSentences(normalizedText);
    let currentChunk = '';

    for (const sentence of sentences) {
      // Se a sentença sozinha é maior que maxChunkSize, dividir ela também
      if (sentence.length > opts.maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // Dividir sentença grande em partes
        const sentenceParts = splitLongSentence(sentence, opts.maxChunkSize);
        chunks.push(...sentenceParts);
        continue;
      }

      // Se adicionar esta sentença exceder o limite, salvar chunk atual
      if (currentChunk.length + sentence.length > opts.maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // Adicionar último chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Dividir por tamanho fixo com overlap
    let startIndex = 0;

    while (startIndex < normalizedText.length) {
      const endIndex = Math.min(startIndex + opts.maxChunkSize, normalizedText.length);
      const chunk = normalizedText.slice(startIndex, endIndex);

      chunks.push(chunk.trim());

      // Mover para o próximo chunk com overlap
      startIndex = endIndex - opts.overlap;
    }
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Divide uma sentença longa em partes menores
 */
function splitLongSentence(sentence: string, maxSize: number): string[] {
  const words = sentence.split(' ');
  const parts: string[] = [];
  let currentPart = '';

  for (const word of words) {
    if (currentPart.length + word.length + 1 > maxSize) {
      if (currentPart) {
        parts.push(currentPart.trim());
      }
      currentPart = word;
    } else {
      currentPart += (currentPart ? ' ' : '') + word;
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts;
}

/**
 * Calcula estatísticas de chunking para debugging
 */
export function getChunkStats(chunks: string[]): {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalCharacters: 0,
    };
  }

  const sizes = chunks.map(c => c.length);
  const totalCharacters = sizes.reduce((sum, size) => sum + size, 0);

  return {
    totalChunks: chunks.length,
    avgChunkSize: Math.round(totalCharacters / chunks.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalCharacters,
  };
}

/**
 * Exemplo de uso:
 *
 * const text = "Seu longo artigo sobre investimentos...";
 * const chunks = chunkText(text, { maxChunkSize: 500, overlap: 50 });
 * const stats = getChunkStats(chunks);
 * console.log(`Dividido em ${stats.totalChunks} chunks com média de ${stats.avgChunkSize} caracteres`);
 */
