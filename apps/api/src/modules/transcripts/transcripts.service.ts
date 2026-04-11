import { getRepos } from '../../repositories';
import { sendEmail } from '../../utils/email.utils';
import { env } from '../../config/env';
import { notify } from '../../utils/notify';
import { CreateTranscriptRequestInput } from './transcripts.validation';

export async function submitTranscriptRequest(data: CreateTranscriptRequestInput) {
  const { transcriptRequests } = getRepos();

  const doc = await transcriptRequests.create({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    yearGroup: data.yearGroup,
    notes: data.notes || null,
    status: 'PENDING',
  });

  try {
    await sendEmail({
      to: env.FROM_EMAIL,
      subject: `[UPOSA] Transcript Request from ${data.fullName}`,
      html: `
        <h3>New Transcript Request</h3>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
        <p><strong>Year Group:</strong> ${data.yearGroup}</p>
        <p><strong>Notes:</strong> ${data.notes || 'None'}</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send transcript request notification:', err);
  }

  notify('NEW_TRANSCRIPT_REQUEST', 'Transcript Request', `${data.fullName} (${data.yearGroup}) requested a transcript.`, '/contact-messages');

  return doc;
}
