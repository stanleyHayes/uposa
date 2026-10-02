import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import type { Request, Response } from 'express';

import { rebuildMarketingOnWrite } from '../../src/utils/marketing-rebuild';

function fakeRes(statusCode: number) {
  return Object.assign(new EventEmitter(), { statusCode }) as unknown as Response & EventEmitter;
}

describe('rebuildMarketingOnWrite', () => {
  it('always calls next and only listens for completion on writes', () => {
    const next = vi.fn();
    const getRes = fakeRes(200);
    rebuildMarketingOnWrite({ method: 'GET', originalUrl: '/api/news/admin' } as Request, getRes, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(getRes.listenerCount('finish')).toBe(0);

    const putRes = fakeRes(200);
    rebuildMarketingOnWrite({ method: 'PUT', originalUrl: '/api/news/admin/abc?x=1' } as Request, putRes, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(putRes.listenerCount('finish')).toBe(1);
  });

  it('is a no-op when no deploy hook is configured', () => {
    // MARKETING_DEPLOY_HOOK_URL is unset in tests: finishing a write must not throw or schedule a fetch.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = fakeRes(201);
    rebuildMarketingOnWrite({ method: 'POST', originalUrl: '/api/admin/executives' } as Request, res, vi.fn());
    res.emit('finish');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
