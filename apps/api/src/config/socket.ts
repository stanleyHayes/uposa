import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, env.ADMIN_URL],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join rooms for specific content
    socket.on('join:poll', (pollId: string) => {
      socket.join(`poll:${pollId}`);
    });

    socket.on('join:election', (electionId: string) => {
      socket.join(`election:${electionId}`);
    });

    socket.on('join:forum', (postId?: string) => {
      socket.join('forum');
      if (postId) socket.join(`forum:${postId}`);
    });

    socket.on('leave:poll', (pollId: string) => {
      socket.leave(`poll:${pollId}`);
    });

    socket.on('leave:election', (electionId: string) => {
      socket.leave(`election:${electionId}`);
    });

    socket.on('leave:forum', (postId?: string) => {
      socket.leave('forum');
      if (postId) socket.leave(`forum:${postId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit helpers
export function emitPollVote(pollId: string, data: { pollId: string; options: any[]; totalVotes: number }) {
  if (io) io.to(`poll:${pollId}`).emit('poll:vote', data);
}

export function emitPollClosed(pollId: string, data: any) {
  if (io) io.to(`poll:${pollId}`).emit('poll:closed', data);
}

export function emitElectionVote(electionId: string, data: { electionId: string; candidateId: string; totalVotes: number }) {
  if (io) io.to(`election:${electionId}`).emit('election:vote', data);
}

export function emitElectionStatus(electionId: string, data: any) {
  if (io) io.to(`election:${electionId}`).emit('election:status', data);
}

export function emitForumNewPost(data: any) {
  if (io) io.to('forum').emit('forum:newPost', data);
}

export function emitForumNewComment(postId: string, data: any) {
  if (io) io.to(`forum:${postId}`).emit('forum:newComment', data);
}

export function emitForumPostUpdated(postId: string, data: any) {
  if (io) io.to(`forum:${postId}`).emit('forum:postUpdated', data);
}
