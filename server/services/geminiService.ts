import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const EMBEDDING_MODEL = 'models/gemini-embedding-001';
export const GENERATION_MODEL = 'models/gemini-2.5-flash-lite';
export const EMBEDDING_DIMENSIONS = 768;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiError = {
  message?: string;
  status?: string;
};

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
  error?: GeminiError;
};

type GeminiGenerationResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: GeminiError;
};

const getApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  return apiKey;
};

const geminiUrl = (model: string, action: string): string =>
  `${GEMINI_BASE_URL}/${model}:${action}?key=${encodeURIComponent(getApiKey())}`;

const readJsonResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${text}`);
  }
};

const formatGeminiError = (
  response: Response,
  payload: { error?: GeminiError }
): string => {
  const message = payload.error?.message || response.statusText;
  const status = payload.error?.status ? ` ${payload.error.status}` : '';

  return `Gemini request failed (${response.status}${status}): ${message}`;
};

export const embedText = async (text: string): Promise<number[]> => {
  const response = await fetch(geminiUrl(EMBEDDING_MODEL, 'embedContent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      content: {
        parts: [{ text }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  const payload = await readJsonResponse<GeminiEmbeddingResponse>(response);

  if (!response.ok) {
    throw new Error(formatGeminiError(response, payload));
  }

  const values = payload.embedding?.values;

  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Gemini embedding response did not contain ${EMBEDDING_DIMENSIONS} values`
    );
  }

  return values;
};

export const generateAnswer = async (prompt: string): Promise<string> => {
  const response = await fetch(geminiUrl(GENERATION_MODEL, 'generateContent'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    }),
  });

  const payload = await readJsonResponse<GeminiGenerationResponse>(response);

  if (!response.ok) {
    throw new Error(formatGeminiError(response, payload));
  }

  const answer = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter((part): part is string => Boolean(part))
    .join('\n')
    .trim();

  if (!answer) {
    throw new Error('Gemini generation response did not contain answer text');
  }

  return answer;
};
