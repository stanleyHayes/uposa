import { Request, Response } from 'express';
import { createEventSchema, updateEventSchema, rsvpSchema } from './events.validation';
import {
  listEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventBySlug,
  rsvpToEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRsvps,
} from './events.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

function parseFormDataBody(body: Record<string, unknown>): Record<string, unknown> {
  const result = { ...body };
  if (typeof result.isFeatured === 'string') {
    result.isFeatured = result.isFeatured === 'true';
  }
  return result;
}

export async function listEventsHandler(req: Request, res: Response): Promise<void> {
  const result = await listEvents(req.query as Record<string, string | undefined>);
  successResponse(res, 'Events retrieved', result.data, 200, result.meta);
}

export async function getUpcomingEventsHandler(req: Request, res: Response): Promise<void> {
  const result = await getUpcomingEvents(req.query as Record<string, string | undefined>);
  successResponse(res, 'Upcoming events retrieved', result.data, 200, result.meta);
}

export async function getPastEventsHandler(req: Request, res: Response): Promise<void> {
  const result = await getPastEvents(req.query as Record<string, string | undefined>);
  successResponse(res, 'Past events retrieved', result.data, 200, result.meta);
}

export async function getEventBySlugHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const event = await getEventBySlug(slug);
  successResponse(res, 'Event retrieved', event);
}

export async function rsvpToEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = rsvpSchema.parse({ body: req.body });
  const memberId = req.user?.id;
  const rsvp = await rsvpToEvent(id, parsed.body, memberId);
  successResponse(res, 'RSVP submitted successfully', rsvp, 201);
}

export async function createEventHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const body = parseFormDataBody(req.body);
  const parsed = createEventSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'events') : undefined;
  const event = await createEvent(req.admin.id, parsed.body, imageUrl);
  successResponse(res, 'Event created successfully', event, 201);
}

export async function updateEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = parseFormDataBody(req.body);
  const parsed = updateEventSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'events') : undefined;
  const event = await updateEvent(id, parsed.body, imageUrl);
  successResponse(res, 'Event updated successfully', event);
}

export async function deleteEventHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteEvent(id);
  successResponse(res, result.message);
}

export async function getEventRsvpsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await getEventRsvps(id, req.query as Record<string, string | undefined>);
  successResponse(res, 'RSVPs retrieved', result.data, 200, result.meta);
}
