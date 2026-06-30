import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index';
import { embedText, generateAnswer } from './geminiService';
import { toVectorLiteral } from './vectorUtils';

const TOP_K_CHUNKS = 3;

type RetrievedChunk = {
  source: string;
  source_id: string;
  chunk_index: number;
  chunk_content: string;
  similarity: number;
};

const retrieveChunks = async (
  questionEmbedding: number[]
): Promise<RetrievedChunk[]> =>
  sequelize.query<RetrievedChunk>(
    `
      SELECT
        source,
        source_id,
        chunk_index,
        chunk_content,
        1 - (embeddings_768 <=> CAST($questionEmbedding AS vector)) AS similarity
      FROM knowledge_base
      WHERE embeddings_768 IS NOT NULL
      ORDER BY embeddings_768 <=> CAST($questionEmbedding AS vector)
      LIMIT ${TOP_K_CHUNKS};
    `,
    {
      bind: {
        questionEmbedding: toVectorLiteral(questionEmbedding),
      },
      type: QueryTypes.SELECT,
    }
  );

const buildPrompt = (userQuestion: string, chunks: RetrievedChunk[]): string => {
  const context = chunks
    .map(
      (chunk, index) =>
        `Source ${index + 1}: ${chunk.source_id}, chunk ${chunk.chunk_index}\n${chunk.chunk_content}`
    )
    .join('\n\n');

  return `
You are LevBoots Brain, a careful assistant for questions about Levitation Boots.
Answer the user question using only the retrieved context below.
If the retrieved context does not contain the answer, say: "I don't know based on the retrieved content."
Keep the answer concise and grounded in the context.

Retrieved context:
${context}

User question:
${userQuestion}
`.trim();
};

export const answerQuestion = async (userQuestion: string): Promise<string> => {
  const question = userQuestion.trim();

  if (!question) {
    throw new Error('Question cannot be empty');
  }

  const questionEmbedding = await embedText(question);
  const chunks = await retrieveChunks(questionEmbedding);

  if (chunks.length === 0) {
    throw new Error('No knowledge base chunks found. Run loadAllData first.');
  }

  return generateAnswer(buildPrompt(question, chunks));
};
