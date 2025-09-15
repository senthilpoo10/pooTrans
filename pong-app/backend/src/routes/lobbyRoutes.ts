// ===== BACKEND: routes/lobbyRoutes.ts =====
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface LobbyRoutesOptions {
  prisma: PrismaClient;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: number;
    username: string;
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
      const decoded = fastify.jwt.verify(token) as { userId: number; username: string };
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId },
        select: { id: true, username: true }
      });
      
      if (!user) {
        return reply.status(401).send({ message: 'User not found' });
      }
      
      (request as AuthenticatedRequest).user = { userId: user.id, username: user.username };
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid token' });
    }
  };

  fastify.addHook('preHandler', authenticate);

  // GET /lobby/overview - Real overview data from database
  fastify.get('/overview', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      // Get complete user data from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePic: true,
          wins: true,
          losses: true,
          favAvatar: true,
          createdAt: true,
          isVerified: true,
          online_status: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get real recent games from database
      const recentGames = await prisma.game.findMany({
        where: { id_user: userId },
        orderBy: { date: 'desc' },
        take: 10
      });

      // Get real friends count from database
      const friendsCount = await prisma.friendship.count({
        where: {
          sender_id: userId,
          status: 'Friend'
        }
      });

      // Process games to extract match details
      const processedMatches = recentGames.map(game => {
        let opponent = 'Unknown';
        let score = 'N/A';
        let isUserWinner = false;

        try {
          if (game.rounds_json) {
            const rounds = JSON.parse(game.rounds_json);
            // Extract opponent from rounds data
            if (rounds.opponent) opponent = rounds.opponent;
            if (rounds.opponentName) opponent = rounds.opponentName;
            if (rounds.player2 && rounds.player2 !== user.username) opponent = rounds.player2;
            if (rounds.player1 && rounds.player1 !== user.username) opponent = rounds.player1;
            
            // Extract result
            if (rounds.winner === user.username) isUserWinner = true;
            if (rounds.winnerId === userId) isUserWinner = true;
            if (rounds.userWon !== undefined) isUserWinner = rounds.userWon;
            
            // Extract score
            if (rounds.finalScore) score = rounds.finalScore;
            if (rounds.score) score = rounds.score;
          }
        } catch (error) {
          console.error('Error parsing rounds_json:', error);
        }

        return {
          id: game.id_game.toString(),
          opponent,
          result: isUserWinner ? 'win' : 'loss',
          score,
          matchType: game.game_name,
          date: game.date.toISOString(),
          duration: '5 min', // Default duration
          isUserWinner
        };
      });

      // Calculate real statistics
      const totalMatches = user.wins + user.losses;
      const winRate = totalMatches > 0 ? parseFloat(((user.wins / totalMatches) * 100).toFixed(1)) : 0.0;
      
      // Calculate current win streak from recent matches
      let currentWinStreak = 0;
      for (const match of processedMatches) {
        if (match.isUserWinner) {
          currentWinStreak++;
        } else {
          break;
        }
      }

      // Calculate monthly wins (games won this month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyGames = recentGames.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear;
      });
      
      let monthlyWins = 0;
      monthlyGames.forEach(game => {
        try {
          const rounds = JSON.parse(game.rounds_json || '{}');
          if (rounds.winner === user.username || rounds.winnerId === userId || rounds.userWon) {
            monthlyWins++;
          }
        } catch (error) {
          // Skip invalid JSON
        }
      });

      return reply.send({
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          avatarUrl: user.profilePic,
          memberSince: user.createdAt.toISOString()
        },
        stats: {
          totalMatches,
          wins: user.wins,
          losses: user.losses,
          winRate,
          currentWinStreak,
          monthlyWins
        },
        recentMatches: processedMatches,
        friendsCount
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch overview data' });
    }
  });

  // GET /lobby/profile - Real profile data
  fastify.get('/profile', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePic: true,
          wins: true,
          losses: true,
          favAvatar: true,
          isVerified: true,
          twoFactorRegistered: true,
          createdAt: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({
        name: user.username,
        email: user.email,
        profilePic: user.profilePic,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        language: 'English', // Default
        favAvatar: user.favAvatar,
        wins: user.wins,
        losses: user.losses,
        isVerified: user.isVerified,
        twoFactorRegistered: user.twoFactorRegistered,
        createdAt: user.createdAt.toISOString()
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch profile data' });
    }
  });

  // GET /lobby/stats - Real user stats
  fastify.get('/stats', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wins: true, losses: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const totalMatches = user.wins + user.losses;
      const winRate = totalMatches > 0 ? parseFloat(((user.wins / totalMatches) * 100).toFixed(1)) : 0.0;

      // Get recent games for win streak calculation
      const recentGames = await prisma.game.findMany({
        where: { id_user: userId },
        orderBy: { date: 'desc' },
        take: 20
      });

      let currentWinStreak = 0;
      for (const game of recentGames) {
        try {
          const rounds = JSON.parse(game.rounds_json || '{}');
          if (rounds.winner === request.user!.username || rounds.winnerId === userId || rounds.userWon) {
            currentWinStreak++;
          } else {
            break;
          }
        } catch (error) {
          break;
        }
      }

      // Calculate monthly wins
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyGames = recentGames.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear;
      });

      let monthlyWins = 0;
      monthlyGames.forEach(game => {
        try {
          const rounds = JSON.parse(game.rounds_json || '{}');
          if (rounds.winner === request.user!.username || rounds.winnerId === userId || rounds.userWon) {
            monthlyWins++;
          }
        } catch (error) {
          // Skip invalid JSON
        }
      });

      return reply.send({
        totalMatches,
        winRate,
        currentWinStreak,
        monthlyWins,
        wins: user.wins,
        losses: user.losses,
        draws: 0 // Not implemented in schema
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch stats' });
    }
  });

  // GET /lobby/friends - Real friends data
  fastify.get('/friends', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      // Get real friends from database
      const friendships = await prisma.friendship.findMany({
        where: {
          sender_id: userId,
          status: 'Friend'
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              profilePic: true,
              online_status: true,
              createdAt: true,
              wins: true,
              losses: true
            }
          }
        }
      });

      const friends = friendships.map(friendship => ({
        id: friendship.receiver.id,
        name: friendship.receiver.username,
        status: friendship.receiver.online_status,
        rank: friendship.receiver.wins, // Using wins as rank
        lastActive: friendship.receiver.createdAt.toISOString()
      }));

      return reply.send(friends);

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch friends' });
    }
  });

  // GET /lobby/recent-matches - Real recent matches
  fastify.get('/recent-matches', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const recentGames = await prisma.game.findMany({
        where: { id_user: userId },
        orderBy: { date: 'desc' },
        take: 10
      });

      const processedMatches = recentGames.map(game => {
        let opponent = 'Unknown';
        let score = 'N/A';
        let isUserWinner = false;

        try {
          if (game.rounds_json) {
            const rounds = JSON.parse(game.rounds_json);
            
            // Extract opponent
            if (rounds.opponent) opponent = rounds.opponent;
            if (rounds.opponentName) opponent = rounds.opponentName;
            if (rounds.player2 && rounds.player2 !== user.username) opponent = rounds.player2;
            if (rounds.player1 && rounds.player1 !== user.username) opponent = rounds.player1;
            
            // Extract result
            if (rounds.winner === user.username) isUserWinner = true;
            if (rounds.winnerId === userId) isUserWinner = true;
            if (rounds.userWon !== undefined) isUserWinner = rounds.userWon;
            
            // Extract score
            if (rounds.finalScore) score = rounds.finalScore;
            if (rounds.score) score = rounds.score;
          }
        } catch (error) {
          console.error('Error parsing rounds_json:', error);
        }

        return {
          id: game.id_game.toString(),
          opponent,
          result: isUserWinner ? 'win' : 'loss',
          score,
          matchType: game.game_name,
          date: game.date.toISOString(),
          duration: '5 min'
        };
      });

      return reply.send(processedMatches);

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch recent matches' });
    }
  });

  // GET /lobby/rally-squad - Real rally squad data
  fastify.get('/rally-squad', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      // Get real friends
      const friendships = await prisma.friendship.findMany({
        where: {
          sender_id: userId,
          status: 'Friend'
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              profilePic: true,
              online_status: true,
              createdAt: true
            }
          }
        }
      });

      const friends = friendships.map(friendship => ({
        id: friendship.receiver.id,
        name: friendship.receiver.username,
        avatarUrl: friendship.receiver.profilePic,
        createdAt: friendship.receiver.createdAt.toISOString()
      }));

      // Get recent opponents from game history
      const recentGames = await prisma.game.findMany({
        where: { id_user: userId },
        orderBy: { date: 'desc' },
        take: 20
      });

      const recentOpponents: any[] = [];
      const seenOpponents = new Set();

      for (const game of recentGames) {
        try {
          if (game.rounds_json) {
            const rounds = JSON.parse(game.rounds_json);
            let opponentName = null;

            if (rounds.opponent) opponentName = rounds.opponent;
            if (rounds.opponentName) opponentName = rounds.opponentName;
            if (rounds.player2 && rounds.player2 !== request.user!.username) opponentName = rounds.player2;
            if (rounds.player1 && rounds.player1 !== request.user!.username) opponentName = rounds.player1;

            if (opponentName && !seenOpponents.has(opponentName)) {
              seenOpponents.add(opponentName);
              recentOpponents.push({
                id: Math.random(), // Generate temp ID
                name: opponentName,
                avatarUrl: null,
                createdAt: game.date.toISOString()
              });

              if (recentOpponents.length >= 5) break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Get real online count
      const onlineCount = await prisma.user.count({
        where: { online_status: 'online' }
      });

      return reply.send({
        friends,
        friendRequests: [],
        recentOpponents,
        onlineCount
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch rally squad data' });
    }
  });

  // GET /lobby/leaderboard - Real leaderboard
  fastify.get('/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const topPlayers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          profilePic: true,
          wins: true,
          losses: true
        },
        where: {
          OR: [
            { wins: { gt: 0 } },
            { losses: { gt: 0 } }
          ]
        },
        orderBy: [
          { wins: 'desc' },
          { losses: 'asc' }
        ],
        take: 20
      });

      const leaderboard = topPlayers.map(player => {
        const totalMatches = player.wins + player.losses;
        const winRate = totalMatches > 0 ? parseFloat(((player.wins / totalMatches) * 100).toFixed(1)) : 0.0;

        return {
          id: player.id,
          name: player.username,
          avatarUrl: player.profilePic,
          wins: player.wins,
          totalMatches,
          winRate
        };
      });

      return reply.send({ leaderboard });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });

  // GET /lobby/match-history - Real match history with pagination
  fastify.get('/match-history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as AuthenticatedRequest).user!.userId;
      const { page = '1', limit = '10' } = request.query as { page?: string, limit?: string };
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const [games, totalCount] = await Promise.all([
        prisma.game.findMany({
          where: { id_user: userId },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum
        }),
        prisma.game.count({
          where: { id_user: userId }
        })
      ]);

      const processedMatches = games.map(game => {
        let opponent = 'Unknown';
        let score = 'N/A';
        let isUserWinner = false;

        try {
          if (game.rounds_json) {
            const rounds = JSON.parse(game.rounds_json);
            
            // Extract opponent
            if (rounds.opponent) opponent = rounds.opponent;
            if (rounds.opponentName) opponent = rounds.opponentName;
            if (rounds.player2 && rounds.player2 !== user.username) opponent = rounds.player2;
            if (rounds.player1 && rounds.player1 !== user.username) opponent = rounds.player1;
            
            // Extract result
            if (rounds.winner === user.username) isUserWinner = true;
            if (rounds.winnerId === userId) isUserWinner = true;
            if (rounds.userWon !== undefined) isUserWinner = rounds.userWon;
            
            // Extract score
            if (rounds.finalScore) score = rounds.finalScore;
            if (rounds.score) score = rounds.score;
          }
        } catch (error) {
          console.error('Error parsing rounds_json:', error);
        }

        return {
          id: game.id_game.toString(),
          opponent,
          result: isUserWinner ? 'win' : 'loss',
          score,
          playedAt: game.date.toISOString()
        };
      });

      return reply.send({
        matches: processedMatches,
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

  // POST /lobby/friends/add - Add friend
  fastify.post<{ Body: { friendId: number } }>('/friends/add', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { friendId } = request.body;

      if (userId === friendId) {
        return reply.status(400).send({ error: 'Cannot add yourself as friend' });
      }

      const friend = await prisma.user.findUnique({
        where: { id: friendId },
        select: { id: true, username: true }
      });

      if (!friend) {
        return reply.status(404).send({ error: 'User not found' });
      }

      await prisma.$transaction([
        prisma.friendship.create({
          data: {
            sender_id: userId,
            receiver_id: friendId,
            sender_username: request.user!.username,
            receiver_username: friend.username,
            status: 'Friend'
          }
        }),
        prisma.friendship.create({
          data: {
            sender_id: friendId,
            receiver_id: userId,
            sender_username: friend.username,
            receiver_username: request.user!.username,
            status: 'Friend'
          }
        })
      ]);

      return reply.send({ message: 'Friend added successfully' });

    } catch (error) {
      if (error.code === 'P2002') {
        return reply.status(400).send({ error: 'Friendship already exists' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add friend' });
    }
  });

  // DELETE /lobby/friends/:friendId - Remove friend
  fastify.delete<{ Params: { friendId: string } }>('/friends/:friendId', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const friendId = parseInt(request.params.friendId);

      await prisma.$transaction([
        prisma.friendship.deleteMany({
          where: {
            sender_id: userId,
            receiver_id: friendId
          }
        }),
        prisma.friendship.deleteMany({
          where: {
            sender_id: friendId,
            receiver_id: userId
          }
        })
      ]);

      return reply.send({ message: 'Friend removed successfully' });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove friend' });
    }
  });
}
