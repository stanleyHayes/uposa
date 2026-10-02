import { getRepos } from '../../repositories';
import { buildTranscriptAcknowledgement, buildTranscriptNotification, sendInBackground } from '../../utils/email.utils';
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

  // Previously sent to FROM_EMAIL (the no-reply address), so nobody received it.
  sendInBackground(env.STAFF_INBOX_EMAIL, buildTranscriptNotification(data), 'transcript-notification', data.email);
  sendInBackground(data.email, buildTranscriptAcknowledgement(data), 'transcript-acknowledgement');

  notify('NEW_TRANSCRIPT_REQUEST', 'Transcript Request', `${data.fullName} (${data.yearGroup}) requested a transcript.`, '/contact-messages');

  return doc;
}
