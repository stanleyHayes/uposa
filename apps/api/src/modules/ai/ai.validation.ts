import { z } from 'zod';

export const writingActionSchema = z.enum([
  'formalize',
  'summarize',
  'make_casual',
  'expand',
  'fix_grammar',
  'create_from_prompt',
  'improve_clarity',
  'generate_title',
  'generate_message',
  'translate',
]);

export const aiWritingSchema = z.object({
  body: z.object({
    action: writingActionSchema,
    text: z.string().max(12000).optional().default(''),
    fullText: z.string().max(16000).optional().default(''),
    prompt: z.string().max(2000).optional().default(''),
    language: z.string().max(80).optional().default('English'),
    fieldContext: z.string().max(160).optional().default('Admin content field'),
    contentType: z.enum(['plain', 'markdown']).optional().default('plain'),
  }),
});

export type AiWritingInput = z.infer<typeof aiWritingSchema>['body'];
export type WritingAction = z.infer<typeof writingActionSchema>;
