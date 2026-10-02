import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { isCorsOriginAllowed } from './cors';
import { MemberTokenPayload, AdminTokenPayload } from '../utils/jwt.utils';
import { resolveMember, resolveAdmin } from '../middleware/auth.middleware';

let io: Server;

/**
 * Resolve a handshake token to a member or admin identity: ACCESS tokens only
 * (refresh tokens are rejected by the verifiers) for accounts that are still
 * live (see utils/session-state.utils.ts). Null when neither verifies.
 */
export async function authenticateSocketToken(token: unknown): Promise<{ user?: MemberTokenPayload; admin?: AdminTokenPayload } | null> {
  if (typeof token !== 'string' || !token) return null;
  const raw = token.startsWith('Bearer ') ? token.substring(7) : token;
  const user = await resolveMember(raw);
  if (user) return { user };
  const admin = await resolveAdmin(raw);
  return admin ? { admin } : null;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isCorsOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Forum posts/comments and vote updates are members-only content: every
  // connection must present a valid member or admin access token
  // (io(url, { auth: { token } })). Clients reconnect with a fresh token after refresh.
  io.use((socket, next) => {
    authenticateSocketToken(socket.handshake.auth?.token)
      .then((identity) => {
        if (!identity) {
          next(new Error('Unauthorized'));
          return;
        }
        socket.data.user = identity.user;
        socket.data.admin = identity.admin;
        next();
      })
      .catch(() => next(new Error('Unauthorized')));
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Personal room, so forum pushes can skip members who blocked the author.
    if (socket.data.user?.id) socket.join(`member:${socket.data.user.id}`);

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

/** `exceptMemberIds`: members who blocked the author — they must not receive it live either. */
export function emitForumNewPost(data: any, exceptMemberIds: string[] = []) {
  if (io) io.to('forum').except(exceptMemberIds.map((id) => `member:${id}`)).emit('forum:newPost', data);
}

export function emitForumNewComment(postId: string, data: any, exceptMemberIds: string[] = []) {
  if (io) io.to(`forum:${postId}`).except(exceptMemberIds.map((id) => `member:${id}`)).emit('forum:newComment', data);
}

export function emitForumPostUpdated(postId: string, data: any) {
  if (io) io.to(`forum:${postId}`).emit('forum:postUpdated', data);
}
