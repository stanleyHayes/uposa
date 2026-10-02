import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_EVENT, ACCESS_TOKEN_KEY } from '../api/client';
import { authApi } from '../api/services';

// Strip only the trailing /api path — a plain replace('/api') would also hit an
// "api." subdomain (https://api.example.org/api → https:/.example.org/api).
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

// Rooms this tab has joined, ref-counted by `${kind}\n${id}`. Room membership
// lives on the server per connection, so every (re)connect re-joins them.
const rooms = new Map<string, number>();
let lastRevive = 0;

function emitRoom(action: 'join' | 'leave', key: string) {
  const [kind, id] = key.split('\n');
  socket?.emit(`${action}:${kind}`, id);
}

// The server checks the access token at the handshake. When it refuses (or
// drops) us, the token has usually expired: a cheap authenticated call lets the
// API client refresh it — which reconnects via AUTH_TOKEN_EVENT — otherwise
// retry once with whatever token we have. Throttled so a persistent refusal
// can't loop.
function revive() {
  if (Date.now() - lastRevive < 30_000) return;
  lastRevive = Date.now();
  authApi.me().catch(() => {}).finally(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    // Skip if a refresh already restarted it (connect() twice opens a second session).
    if (socket && !socket.active && token) {
      socket.auth = { token };
      socket.connect();
    }
  });
}

function getSocket(): Socket {
  if (!socket) {
    const s = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: { token: localStorage.getItem(ACCESS_TOKEN_KEY) },
    });
    s.on('connect', () => {
      for (const key of rooms.keys()) emitRoom('join', key);
    });
    s.on('connect_error', () => {
      // `active` is false when the server rejected the handshake (no auto-retry).
      if (!s.active) revive();
    });
    s.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') revive();
    });
    // New token after a refresh/login, null on logout. A live or retrying
    // socket picks the new auth up on its next handshake; one the server
    // refused (inactive) has to be restarted.
    window.addEventListener(AUTH_TOKEN_EVENT, (event) => {
      const token = (event as CustomEvent<string | null>).detail;
      s.auth = { token };
      if (!token) {
        s.disconnect();
      } else if (!s.active) {
        s.connect();
      }
    });
    socket = s;
  }
  return socket;
}

function joinRoom(kind: string, id: string) {
  const key = `${kind}\n${id}`;
  const count = rooms.get(key) ?? 0;
  rooms.set(key, count + 1);
  const s = getSocket();
  // When not connected yet, the 'connect' handler joins it.
  if (count === 0 && s.connected) emitRoom('join', key);
}

function leaveRoom(kind: string, id: string) {
  const key = `${kind}\n${id}`;
  const count = rooms.get(key) ?? 0;
  if (count > 1) {
    rooms.set(key, count - 1);
    return;
  }
  rooms.delete(key);
  if (socket?.connected) emitRoom('leave', key);
}

// Hook to subscribe to a specific event
export function useSocketEvent<T = any>(event: string, callback: (data: T) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const s = getSocket();
    const handler = (data: T) => callbackRef.current(data);
    s.on(event, handler);
    return () => { s.off(event, handler); };
  }, [event]);
}

// Hook to join/leave a room, e.g. 'forum', 'forum:<postId>', 'poll:<id>'. '' joins nothing.
export function useSocketRoom(room: string) {
  useEffect(() => {
    if (!room) return;
    const [kind, id = ''] = room.split(':');
    joinRoom(kind, id);
    return () => leaveRoom(kind, id);
  }, [room]);
}

// Hook to join one room per id, e.g. every active poll on a list page.
export function useSocketRooms(kind: 'poll' | 'election', ids: string[]) {
  const key = ids.join(',');
  useEffect(() => {
    if (!key) return;
    const list = key.split(',');
    list.forEach((id) => joinRoom(kind, id));
    return () => list.forEach((id) => leaveRoom(kind, id));
  }, [kind, key]);
}

// Hook for polls — join room + listen for vote updates
export function usePollSocket(pollId: string, onVoteUpdate: (data: { pollId: string; options: any[]; totalVotes: number }) => void) {
  useSocketRoom(`poll:${pollId}`);
  useSocketEvent('poll:vote', (data: any) => {
    if (data.pollId === pollId) onVoteUpdate(data);
  });
  useSocketEvent('poll:closed', (data: any) => {
    if (data.pollId === pollId || data.id === pollId) onVoteUpdate(data);
  });
}

// Hook for elections — join room + listen for vote updates
export function useElectionSocket(electionId: string, onVoteUpdate: (data: { electionId: string; candidateId: string; totalVotes: number }) => void) {
  useSocketRoom(`election:${electionId}`);
  useSocketEvent('election:vote', (data: any) => {
    if (data.electionId === electionId) onVoteUpdate(data);
  });
}

// Hook for forum — join room + listen for new posts/comments
export function useForumSocket(opts: {
  postId?: string;
  onNewPost?: (data: any) => void;
  onNewComment?: (data: any) => void;
}) {
  const { postId, onNewPost, onNewComment } = opts;

  useSocketRoom(postId ? `forum:${postId}` : 'forum');

  useSocketEvent('forum:newPost', useCallback((data: any) => {
    onNewPost?.(data);
  }, [onNewPost]));

  useSocketEvent('forum:newComment', useCallback((data: any) => {
    onNewComment?.(data);
  }, [onNewComment]));
}

// Expose raw socket for manual use
export function getSocketInstance(): Socket {
  return getSocket();
}
