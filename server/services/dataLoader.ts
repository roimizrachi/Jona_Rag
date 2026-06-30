import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';
import { QueryTypes } from 'sequelize';
import { KnowledgeBase, sequelize } from '../models/index';
import { embedText } from './geminiService';
import { toVectorLiteral } from './vectorUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_SIZE_WORDS = 400;
const SOURCE = 'pdf';
const FIRST_PDF_FILE_NAME = 'OpEd - A Revolution at Our Feet.pdf';

const firstPdfPath = path.resolve(
  __dirname,
  '..',
  'knowledge_pdfs',
  FIRST_PDF_FILE_NAME
);

const normalizeWhitespace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

const readFirstPdfText = async (): Promise<string> => {
  const pdfBuffer = await readFile(firstPdfPath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const result = await parser.getText();
    const text = normalizeWhitespace(result.text);

    if (!text) {
      throw new Error(`${FIRST_PDF_FILE_NAME} did not contain extractable text`);
    }

    return text;
  } finally {
    await parser.destroy();
  }
};

const chunkText = (text: string): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += CHUNK_SIZE_WORDS) {
    chunks.push(words.slice(index, index + CHUNK_SIZE_WORDS).join(' '));
  }

  return chunks;
};

const chunkExists = async (chunkIndex: number): Promise<boolean> => {
  const existingChunk = await KnowledgeBase.findOne({
    where: {
      source: SOURCE,
      source_id: FIRST_PDF_FILE_NAME,
      chunk_index: chunkIndex,
    },
  });

  return Boolean(existingChunk);
};

const storeChunk = async (
  chunkContent: string,
  chunkIndex: number,
  embedding: number[]
): Promise<void> => {
  await sequelize.query(
    `
      INSERT INTO knowledge_base (
        source,
        source_id,
        chunk_index,
        chunk_content,
        embeddings_768,
        created_at,
        updated_at
      )
      VALUES (
        $source,
        $sourceId,
        $chunkIndex,
        $chunkContent,
        CAST($embedding AS vector),
        NOW(),
        NOW()
      );
    `,
    {
      bind: {
        source: SOURCE,
        sourceId: FIRST_PDF_FILE_NAME,
        chunkIndex,
        chunkContent,
        embedding: toVectorLiteral(embedding),
      },
      type: QueryTypes.INSERT,
    }
  );
};

export const loadFirstPdf = async (): Promise<void> => {
  const pdfText = await readFirstPdfText();
  const chunks = chunkText(pdfText);

  for (const [chunkIndex, chunkContent] of chunks.entries()) {
    if (await chunkExists(chunkIndex)) {
      continue;
    }

    const embedding = await embedText(chunkContent);
    await storeChunk(chunkContent, chunkIndex, embedding);
  }
};
