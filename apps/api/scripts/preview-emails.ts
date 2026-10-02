/**
 * Render every UPOSA email with sample data to email-previews/ (HTML + plain
 * text) so templates can be reviewed in a browser without sending anything.
 *
 *   npm run email:preview -w apps/api   →   open apps/api/email-previews/index.html
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { sampleEmails } from '../src/utils/email.utils';

const outDir = path.resolve(__dirname, '../email-previews');
mkdirSync(outDir, { recursive: true });

const emails = sampleEmails();
const items: string[] = [];
for (const [name, email] of Object.entries(emails)) {
  writeFileSync(path.join(outDir, `${name}.html`), email.html);
  writeFileSync(path.join(outDir, `${name}.txt`), `Subject: ${email.subject}\n\n${email.text}`);
  items.push(`<li><a href="${name}.html">${name}</a>: ${email.subject} (<a href="${name}.txt">plain text</a>)</li>`);
}
writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>UPOSA email previews</title><body style="font-family:sans-serif;padding:24px"><h1>UPOSA email previews</h1><ul>${items.join('')}</ul></body>`,
);
console.log(`Wrote ${items.length} email previews to ${outDir}`);
