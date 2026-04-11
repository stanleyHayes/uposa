import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
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

// Hook to join/leave a room
export function useSocketRoom(room: string) {
  useEffect(() => {
    const s = getSocket();
    s.emit(`join:${room.split(':')[0]}`, room.split(':')[1] || '');
    return () => {
      s.emit(`leave:${room.split(':')[0]}`, room.split(':')[1] || '');
    };
  }, [room]);
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

  useEffect(() => {
    const s = getSocket();
    s.emit('join:forum', postId);
    return () => { s.emit('leave:forum', postId); };
  }, [postId]);

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
