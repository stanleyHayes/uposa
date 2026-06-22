import { env } from '../../config/env';
import type { AiWritingInput, WritingAction } from './ai.validation';

interface UsageBucket {
  count: number;
  resetAt: number;
}

interface AiWritingResult {
  output: string;
  action: WritingAction;
  model: string;
  usage: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
}

const usageBuckets = new Map<string, UsageBucket>();

const actionInstructions: Record<WritingAction, string> = {
  formalize: 'Rewrite the text in a polished, professional administrative tone.',
  summarize: 'Shorten the text into a clearer summary while preserving the essential meaning.',
  make_casual: 'Rewrite the text in a friendly, simple, conversational tone.',
  expand: 'Add helpful detail while keeping the original meaning and facts intact.',
  fix_grammar: 'Correct spelling, grammar, punctuation, and sentence structure without changing the meaning.',
  create_from_prompt: 'Create complete text from the admin prompt and any provided context.',
  improve_clarity: 'Make the text easier to understand, more direct, and better organized.',
  generate_title: 'Create one suitable title or headline from the provided body content.',
  generate_message: 'Compose a clear email, SMS, announcement, reminder, or notification.',
  translate: 'Translate the text into the requested language while preserving meaning and formatting.',
};

function getUsageBucket(adminId: string): UsageBucket {
  const now = Date.now();
  const existing = usageBuckets.get(adminId);
  if (existing && existing.resetAt > now) return existing;

  const next = { count: 0, resetAt: now + 60 * 60 * 1000 };
  usageBuckets.set(adminId, next);
  return next;
}

function reserveUsage(adminId: string) {
  const bucket = getUsageBucket(adminId);
  const limit = env.AI_WRITING_LIMIT_PER_HOUR;

  if (bucket.count >= limit) {
    const error = Object.assign(new Error('AI writing limit reached. Try again later.'), {
      statusCode: 429,
      usage: {
        limit,
        remaining: 0,
        resetAt: new Date(bucket.resetAt).toISOString(),
      },
    });
    throw error;
  }

  bucket.count += 1;
  return {
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: new Date(bucket.resetAt).toISOString(),
  };
}

function buildInstructions(input: AiWritingInput): string {
  const formattingInstruction = input.contentType === 'markdown'
    ? 'Return valid Markdown when formatting is useful. Preserve links, lists, and headings when improving existing Markdown.'
    : 'Return plain text only.';

  return [
    'You are the UPOSA admin writing assistant.',
    'Help administrators write clear, accurate association content.',
    'Do not invent names, dates, amounts, URLs, decisions, or facts that were not provided.',
    'Return only the finished text. Do not include explanations, labels, quotation marks, or markdown fences.',
    formattingInstruction,
    actionInstructions[input.action],
  ].join(' ');
}

function buildInput(input: AiWritingInput): string {
  const selectedOrCurrent = input.text.trim();
  const fullText = input.fullText.trim();
  const prompt = input.prompt.trim();

  return [
    `Field context: ${input.fieldContext}`,
    `Action: ${input.action}`,
    input.action === 'translate' ? `Target language: ${input.language || 'English'}` : '',
    prompt ? `Admin prompt: ${prompt}` : '',
    selectedOrCurrent ? `Text to work on:\n${selectedOrCurrent}` : '',
    fullText && fullText !== selectedOrCurrent ? `Full field content for context:\n${fullText}` : '',
  ].filter(Boolean).join('\n\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractOutputText(payload: unknown): string {
  if (!isRecord(payload)) return '';
  if (typeof payload.output_text === 'string') return payload.output_text.trim();

  const output = payload.output;
  if (!Array.isArray(output)) return '';

  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }

  return parts.join('\n').trim();
}

function extractErrorMessage(payload: unknown): string {
  if (!isRecord(payload)) return 'OpenAI request failed';
  const error = payload.error;
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  if (typeof payload.message === 'string') return payload.message;
  return 'OpenAI request failed';
}

export async function runAiWritingAssistant(adminId: string, input: AiWritingInput): Promise<AiWritingResult> {
  if (!env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OpenAI is not configured. Add OPENAI_API_KEY to the API environment.'), { statusCode: 503 });
  }

  if (!input.text.trim() && !input.fullText.trim() && !input.prompt.trim()) {
    throw Object.assign(new Error('Add text or a prompt before using the AI writing assistant.'), { statusCode: 400 });
  }

  const usage = reserveUsage(adminId);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      reasoning: { effort: 'low' },
      instructions: buildInstructions(input),
      input: buildInput(input),
    }),
  });

  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(new Error(extractErrorMessage(payload)), { statusCode: response.status >= 500 ? 502 : response.status });
  }

  const output = extractOutputText(payload);
  if (!output) {
    throw Object.assign(new Error('OpenAI returned an empty writing suggestion.'), { statusCode: 502 });
  }

  return {
    output,
    action: input.action,
    model: env.OPENAI_MODEL,
    usage,
  };
}
