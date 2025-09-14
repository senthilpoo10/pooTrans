// pong-app/backend/src/routes/lobbyRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/auth';

interface LobbyRoutesOptions {
  prisma: PrismaClient;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
  };
}

export default function lobbyRoutes(fastify: FastifyInstance, options: LobbyRoutesOptions) {
  const { prisma } = options;

  // Authentication middleware
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.authToken;
    
    if (!token) {
      return reply.status(401).send({ message: 'Authentication required' });
    }

    try {
      const decoded = verifyToken(token) as { userId: string };
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId },
        select: { id: true, email: true }
      });
      
      if (!user) {
        return reply.status(401).send({ message: 'User not found' });
      }
      
      (request as AuthenticatedRequest).user = user;
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid token' });
    }
  };

  // Add authentication hook
  fastify.addHook('preHandler', authenticate);

  // Get user overview/stats
  fastify.get('/overview', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;

      // Get user with basic info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          friends: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get match statistics
      const [totalMatches, wins, losses] = await Promise.all([
        // Total matches played
        prisma.match.count({
          where: {
            OR: [
              { player1Id: userId },
              { player2Id: userId }
            ]
          }
        }),
        // Wins
        prisma.match.count({
          where: { winnerId: userId }
        }),
        // Losses
        prisma.match.count({
          where: {
            AND: [
              {
                OR: [
                  { player1Id: userId },
                  { player2Id: userId }
                ]
              },
              {
                NOT: { winnerId: userId }
              }
            ]
          }
        })
      ]);

      // Get recent matches (last 5)
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        },
        include: {
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' },
        take: 5
      });

      const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          memberSince: user.createdAt
        },
        stats: {
          totalMatches,
          wins,
          losses,
          winRate: parseFloat(winRate)
        },
        recentMatches: recentMatches.map(match => ({
          id: match.id,
          date: match.date,
          player1: match.player1,
          player2: match.player2,
          winner: match.winner,
          isUserWinner: match.winnerId === userId
        })),
        friendsCount: user.friends.length
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch overview data' });
    }
  });

  // Get user profile (My Locker)
  fastify.get('/profile', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isVerified: true,
          twoFactorRegistered: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({
        profile: user,
        // Add achievements, badges, or other profile data here
        achievements: [],
        badges: []
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch profile data' });
    }
  });

  // Get friends list and online players (Rally Squad)
  fastify.get('/rally-squad', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;

      // Get user's friends
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          friends: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              createdAt: true
            }
          },
          friendOf: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              createdAt: true
            }
          }
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get recent players (players you've played with recently)
      const recentOpponents = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ]
        },
        include: {
          player1: { select: { id: true, name: true, avatarUrl: true } },
          player2: { select: { id: true, name: true, avatarUrl: true } }
        },
        orderBy: { date: 'desc' },
        take: 10
      });

      // Extract unique opponents
      const opponents = new Map();
      recentOpponents.forEach(match => {
        const opponent = match.player1Id === userId ? match.player2 : match.player1;
        if (opponent.id !== userId && !opponents.has(opponent.id)) {
          opponents.set(opponent.id, opponent);
        }
      });

      return reply.send({
        friends: user.friends,
        friendRequests: [], // Implement if you add friend request system
        recentOpponents: Array.from(opponents.values()).slice(0, 5),
        // Note: Online status would require WebSocket integration
        // For now, we'll just return static data
        onlineCount: 0
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch rally squad data' });
    }
  });

  // Get match history
  fastify.get('/match-history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as AuthenticatedRequest).user!.id;
      const { page = '1', limit = '10' } = request.query as { page?: string, limit?: string };
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [matches, totalCount] = await Promise.all([
        prisma.match.findMany({
          where: {
            OR: [
              { player1Id: userId },
              { player2Id: userId }
            ]
          },
          include: {
            player1: { select: { id: true, name: true, avatarUrl: true } },
            player2: { select: { id: true, name: true, avatarUrl: true } },
            winner: { select: { id: true, name: true } }
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum
        }),
        prisma.match.count({
          where: {
            OR: [
              { player1Id: userId },
              { player2Id: userId }
            ]
          }
        })
      ]);

      const matchHistory = matches.map(match => ({
        id: match.id,
        date: match.date,
        player1: match.player1,
        player2: match.player2,
        winner: match.winner,
        isUserWinner: match.winnerId === userId,
        result: match.winnerId === userId ? 'win' : 'loss',
        opponent: match.player1Id === userId ? match.player2 : match.player1
      }));

      return reply.send({
        matches: matchHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch match history' });
    }
  });

  // Get leaderboard
  fastify.get('/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get top players by win count
      const topPlayers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          winnerMatches: {
            select: {
              id: true
            }
          },
          player1Matches: {
            select: {
              id: true
            }
          },
          player2Matches: {
            select: {
              id: true
            }
          }
        },
        take: 10
      });

      const leaderboard = topPlayers.map(player => {
        const wins = player.winnerMatches.length;
        const totalMatches = player.player1Matches.length + player.player2Matches.length;
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100) : 0;

        return {
          id: player.id,
          name: player.name,
          avatarUrl: player.avatarUrl,
          wins,
          totalMatches,
          winRate: parseFloat(winRate.toFixed(1))
        };
      }).sort((a, b) => {
        // Sort by wins first, then by win rate
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      });

      return reply.send({ leaderboard });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Add friend
  fastify.post<{ Body: { friendId: string } }>('/friends/add', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const { friendId } = request.body;

      if (userId === friendId) {
        return reply.status(400).send({ error: 'Cannot add yourself as friend' });
      }

      // Check if friend exists
      const friend = await prisma.user.findUnique({
        where: { id: friendId }
      });

      if (!friend) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Add friend relationship (bidirectional)
      await prisma.user.update({
        where: { id: userId },
        data: {
          friends: {
            connect: { id: friendId }
          }
        }
      });

      return reply.send({ message: 'Friend added successfully' });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add friend' });
    }
  });

  // Remove friend
  fastify.delete<{ Params: { friendId: string } }>('/friends/:friendId', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const { friendId } = request.params;

      await prisma.user.update({
        where: { id: userId },
        data: {
          friends: {
            disconnect: { id: friendId }
          }
        }
      });

      return reply.send({ message: 'Friend removed successfully' });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove friend' });
    }
  });
}