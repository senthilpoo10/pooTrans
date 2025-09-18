// backend/src/routes/gameRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface GameSaveRequest {
  gameType: 'pong' | 'keyclash';
  mode: 'local' | 'remote';
  player1Data: {
    username: string;
    avatar: string;
    score: number;
    isWinner: boolean;
  };
  player2Data: {
    username: string;
    avatar: string;
    score: number;
    isWinner: boolean;
  };
  duration: number;
  rounds: any[];
  gameId: string;
}

interface AuthenticatedUser {
  userId: number;
  username: string;
}

export default function gameRoutes(fastify: FastifyInstance, options: { prisma: PrismaClient }) {
  const { prisma } = options;

  // Helper function to get authenticated user
  const getAuthenticatedUser = (request: FastifyRequest): AuthenticatedUser => {
    return (request as any).user as AuthenticatedUser;
  };

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
      
      (request as any).user = { userId: user.id, username: user.username };
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid token' });
    }
  };

  fastify.addHook('preHandler', authenticate);

  // Save game result
  fastify.post<{ Body: GameSaveRequest }>('/games/save', async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const { gameType, mode, player1Data, player2Data, duration, rounds, gameId } = request.body;

      console.log('Saving game result:', { gameType, mode, player1Data, player2Data, duration });

      // Create game record
      const game = await prisma.game.create({
        data: {
          id_user: user.userId,
          game_name: gameType === 'pong' ? 'pingpong' : 'keyclash',
          rounds_json: JSON.stringify({
            gameId,
            mode,
            player1: player1Data,
            player2: player2Data,
            duration,
            rounds,
            timestamp: new Date(),
            winner: player1Data.isWinner ? player1Data.username : player2Data.username,
            userWon: player1Data.username === user.username ? player1Data.isWinner : player2Data.isWinner,
            finalScore: `${player1Data.score} - ${player2Data.score}`
          })
        }
      });

      // Update user statistics
      const winner = player1Data.isWinner ? player1Data : player2Data;
      const loser = player1Data.isWinner ? player2Data : player1Data;

      // Update winner stats (only if winner is a registered user)
      if (winner.username === user.username) {
        await prisma.user.update({
          where: { id: user.userId },
          data: { wins: { increment: 1 } }
        });
      }

      // Update loser stats (only for remote games and if loser is the current user)
      if (mode === 'remote' && loser.username === user.username) {
        await prisma.user.update({
          where: { id: user.userId },
          data: { losses: { increment: 1 } }
        });
      }

      // For remote games, try to update opponent stats (if they exist)
      if (mode === 'remote') {
        const opponentUsername = player1Data.username === user.username ? player2Data.username : player1Data.username;
        const opponentIsWinner = player1Data.username === user.username ? player2Data.isWinner : player1Data.isWinner;
        
        try {
          if (opponentIsWinner) {
            await prisma.user.updateMany({
              where: { username: opponentUsername },
              data: { wins: { increment: 1 } }
            });
          } else {
            await prisma.user.updateMany({
              where: { username: opponentUsername },
              data: { losses: { increment: 1 } }
            });
          }
        } catch (error) {
          console.log('Could not update opponent stats - user may not exist in database');
        }
      }

      return reply.send({ 
        success: true, 
        gameId: game.id_game,
        message: 'Game result saved successfully' 
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to save game result' 
      });
    }
  });

  // Get player statistics
  fastify.get('/stats/:username?', async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const { username } = request.params as { username?: string };
      
      const targetUser = username || user.username;

      const userStats = await prisma.user.findUnique({
        where: { username: targetUser },
        select: {
          username: true,
          wins: true,
          losses: true,
          createdAt: true
        }
      });

      if (!userStats) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get recent games for additional stats
      const recentGames = await prisma.game.findMany({
        where: { 
          id_user: user.userId 
        },
        orderBy: { date: 'desc' },
        take: 50
      });

      // Calculate additional statistics
      const totalMatches = userStats.wins + userStats.losses;
      const winRate = totalMatches > 0 ? (userStats.wins / totalMatches) * 100 : 0;

      // Calculate current win streak
      let currentStreak = 0;
      for (const game of recentGames) {
        try {
          const gameData = JSON.parse(game.rounds_json);
          if (gameData.userWon) {
            currentStreak++;
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      }

      return reply.send({
        username: userStats.username,
        wins: userStats.wins,
        losses: userStats.losses,
        totalMatches,
        winRate: Math.round(winRate * 10) / 10,
        currentStreak,
        memberSince: userStats.createdAt
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch player stats' });
    }
  });

  // Get recent matches
  fastify.get('/recent-matches', async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const { limit = 10 } = request.query as { limit?: number };

      const games = await prisma.game.findMany({
        where: { id_user: user.userId },
        orderBy: { date: 'desc' },
        take: Number(limit)
      });

      const matches = games.map(game => {
        try {
          const gameData = JSON.parse(game.rounds_json);
          
          const userIsPlayer1 = gameData.player1?.username === user.username;
          const userPlayer = userIsPlayer1 ? gameData.player1 : gameData.player2;
          const opponentPlayer = userIsPlayer1 ? gameData.player2 : gameData.player1;

          return {
            id: game.id_game.toString(),
            gameType: game.game_name,
            opponent: opponentPlayer?.username || 'Unknown',
            result: gameData.userWon ? 'win' : 'loss',
            score: gameData.finalScore || `${userPlayer?.score || 0} - ${opponentPlayer?.score || 0}`,
            duration: `${Math.floor(gameData.duration / 60)}:${String(gameData.duration % 60).padStart(2, '0')}`,
            date: game.date.toISOString(),
            mode: gameData.mode || 'unknown'
          };
        } catch (e) {
          return {
            id: game.id_game.toString(),
            gameType: game.game_name,
            opponent: 'Unknown',
            result: 'unknown',
            score: 'N/A',
            duration: '0:00',
            date: game.date.toISOString(),
            mode: 'unknown'
          };
        }
      });

      return reply.send(matches);

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch recent matches' });
    }
  });

  // Get detailed match information
  fastify.get('/matches/:matchId', async (request, reply) => {
    try {
      const user = getAuthenticatedUser(request);
      const { matchId } = request.params as { matchId: string };

      const game = await prisma.game.findFirst({
        where: { 
          id_game: parseInt(matchId),
          id_user: user.userId 
        }
      });

      if (!game) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      const gameData = JSON.parse(game.rounds_json);

      return reply.send({
        id: game.id_game,
        gameType: game.game_name,
        date: game.date,
        ...gameData
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch match details' });
    }
  });
}