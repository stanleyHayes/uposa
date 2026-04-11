import { Request, Response } from 'express';
import { subscribeSchema } from './newsletter.validation';
import { subscribe, listSubscribers, unsubscribe, deleteSubscriber } from './newsletter.service';
import { successResponse } from '../../utils/response.utils';

export async function subscribeHandler(req: Request, res: Response): Promise<void> {
  const parsed = subscribeSchema.parse({ body: req.body });
  const result = await subscribe(parsed.body);
  successResponse(res, result.alreadySubscribed ? 'Already subscribed' : 'Subscribed successfully', result, 201);
}

// Admin
export async function adminListSubscribersHandler(req: Request, res: Response): Promise<void> {
  const { data, meta } = await listSubscribers(req.query as Record<string, string>);
  successResponse(res, 'Subscribers retrieved', data, 200, meta);
}

export async function adminUnsubscribeHandler(req: Request, res: Response): Promise<void> {
  const result = await unsubscribe(req.params.id);
  successResponse(res, result.message);
}

export async function adminDeleteSubscriberHandler(req: Request, res: Response): Promise<void> {
  const result = await deleteSubscriber(req.params.id);
  successResponse(res, result.message);
}
