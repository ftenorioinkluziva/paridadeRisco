-- Alterar dimensão do vetor de embeddings de 1536 para 768
-- Isso é necessário porque o modelo Google Gemini text-embedding-004 gera vetores de 768 dimensões

-- Primeiro, deletar todos os embeddings existentes (se houver) pois são incompatíveis
DELETE FROM "Embedding";

-- Alterar o tipo da coluna
ALTER TABLE "Embedding" ALTER COLUMN "embedding" TYPE vector(768);
