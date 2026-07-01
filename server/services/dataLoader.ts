import { readdir, readFile } from 'fs/promises';
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
const KNOWLEDGE_PDFS_DIR = path.resolve(__dirname, '..', 'knowledge_pdfs');
const ARTICLE_BASE_URL =
  'https://gist.githubusercontent.com/JonaCodes/394d01021d1be03c9fe98cd9696f5cf3/raw';
const SLACK_API_BASE_URL = 'https://lev-boots-slack-api.jona-581.workers.dev/';
const SLACK_REQUEST_DELAY_MS = 1000;
const SLACK_RETRY_DELAY_MS = 2000;
const MAX_SLACK_RETRIES = 5;

const ARTICLE_IDS = [
  'military-deployment-report',
  'urban-commuting',
  'hover-polo',
  'warehousing',
  'consumer-safety',
];

const SLACK_CHANNELS = ['lab-notes', 'engineering', 'offtopic'];

type SourceType = 'pdf' | 'article' | 'slack';

type SourceDocument = {
  sourceName: string;
  sourceType: SourceType;
  content: string;
};

type SourceChunk = {
  sourceName: string;
  sourceType: SourceType;
  chunkIndex: number;
  content: string;
};

type SlackMessage = {
  id?: string;
  channel?: string;
  user?: string;
  role?: string;
  ts?: string;
  text?: string;
  thread_ts?: string;
};

type SlackPage = {
  page?: number;
  limit?: number;
  total?: number;
  items?: SlackMessage[];
};

const normalizeWhitespace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const readPdfText = async (filePath: string, fileName: string): Promise<string> => {
  const pdfBuffer = await readFile(filePath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const result = await parser.getText();
    const text = normalizeWhitespace(result.text);

    if (!text) {
      throw new Error(`${fileName} did not contain extractable text`);
    }

    return text;
  } finally {
    await parser.destroy();
  }
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

const fetchSlackPage = async (
  channel: string,
  page: number
): Promise<SlackPage> => {
  const url = new URL(SLACK_API_BASE_URL);
  url.searchParams.set('channel', channel);
  url.searchParams.set('page', String(page));

  let response = await fetch(url);

  for (
    let attempt = 1;
    response.status === 429 && attempt <= MAX_SLACK_RETRIES;
    attempt += 1
  ) {
    const retryDelayMs = SLACK_RETRY_DELAY_MS * attempt;

    console.warn(
      `Slack API returned 429 for channel ${channel} page ${page}; retry attempt ${attempt}/${MAX_SLACK_RETRIES} in ${retryDelayMs / 1000}s.`
    );

    await delay(retryDelayMs);
    response = await fetch(url);

    if (response.status === 429 && attempt === MAX_SLACK_RETRIES) {
      throw new Error(
        `Failed to fetch Slack channel ${channel} page ${page} after retry attempt ${attempt}: ${response.status} ${response.statusText}`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Slack channel ${channel} page ${page}: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as SlackPage;
};

const loadPdfDocuments = async (): Promise<SourceDocument[]> => {
  const fileNames = (await readdir(KNOWLEDGE_PDFS_DIR))
    .filter((fileName) => fileName.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b));

  const documents: SourceDocument[] = [];

  for (const fileName of fileNames) {
    const filePath = path.join(KNOWLEDGE_PDFS_DIR, fileName);
    const content = await readPdfText(filePath, fileName);

    documents.push({
      sourceName: fileName,
      sourceType: 'pdf',
      content,
    });
  }

  return documents;
};

const loadArticleDocuments = async (): Promise<SourceDocument[]> => {
  const documents: SourceDocument[] = [];

  for (const [index, articleId] of ARTICLE_IDS.entries()) {
    const articleNumber = index + 1;
    const url = `${ARTICLE_BASE_URL}/article-${articleNumber}_${articleId}.md`;
    const content = normalizeWhitespace(await fetchText(url));

    documents.push({
      sourceName: articleId,
      sourceType: 'article',
      content,
    });
  }

  return documents;
};

const formatSlackMessage = (message: SlackMessage): string => {
  const user = message.user || 'unknown user';
  const role = message.role ? ` (${message.role})` : '';
  const timestamp = message.ts ? ` at ${message.ts}` : '';
  const thread = message.thread_ts ? ` thread ${message.thread_ts}` : '';
  const id = message.id ? ` message ${message.id}` : '';
  const text = normalizeWhitespace(message.text || '');

  return `${user}${role}${timestamp}${id}${thread}: ${text}`;
};

const loadSlackChannelDocument = async (
  channel: string
): Promise<SourceDocument> => {
  const messages: SlackMessage[] = [];

  for (let page = 1; ; page += 1) {
    const slackPage = await fetchSlackPage(channel, page);
    const pageItems = slackPage.items || [];

    if (pageItems.length === 0) {
      break;
    }

    messages.push(...pageItems);

    if (slackPage.total && messages.length >= slackPage.total) {
      break;
    }

    await delay(SLACK_REQUEST_DELAY_MS);
  }

  const content = messages.map(formatSlackMessage).join('\n');

  return {
    sourceName: `slack-${channel}`,
    sourceType: 'slack',
    content: normalizeWhitespace(content),
  };
};

const loadSlackDocuments = async (): Promise<SourceDocument[]> => {
  const documents: SourceDocument[] = [];

  for (const channel of SLACK_CHANNELS) {
    documents.push(await loadSlackChannelDocument(channel));
    await delay(SLACK_REQUEST_DELAY_MS);
  }

  return documents;
};

const loadSourceDocuments = async (): Promise<SourceDocument[]> => [
  ...(await loadPdfDocuments()),
  ...(await loadArticleDocuments()),
  ...(await loadSlackDocuments()),
];

const chunkText = (text: string): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += CHUNK_SIZE_WORDS) {
    chunks.push(words.slice(index, index + CHUNK_SIZE_WORDS).join(' '));
  }

  return chunks;
};

const chunkDocument = (document: SourceDocument): SourceChunk[] =>
  chunkText(document.content).map((content, chunkIndex) => ({
    sourceName: document.sourceName,
    sourceType: document.sourceType,
    chunkIndex,
    content,
  }));

const chunkDocuments = (documents: SourceDocument[]): SourceChunk[] =>
  documents.flatMap(chunkDocument);

const chunkExists = async (chunk: SourceChunk): Promise<boolean> => {
  const existingChunk = await KnowledgeBase.findOne({
    where: {
      source: chunk.sourceType,
      source_id: chunk.sourceName,
      chunk_index: chunk.chunkIndex,
    },
  });

  return Boolean(existingChunk);
};

const storeChunk = async (
  chunk: SourceChunk,
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
        source: chunk.sourceType,
        sourceId: chunk.sourceName,
        chunkIndex: chunk.chunkIndex,
        chunkContent: chunk.content,
        embedding: toVectorLiteral(embedding),
      },
      type: QueryTypes.INSERT,
    }
  );
};

export const loadAllDataSources = async (): Promise<void> => {
  const documents = await loadSourceDocuments();
  const chunks = chunkDocuments(documents);

  for (const chunk of chunks) {
    if (await chunkExists(chunk)) {
      continue;
    }

    const embedding = await embedText(chunk.content);
    await storeChunk(chunk, embedding);
  }
};
