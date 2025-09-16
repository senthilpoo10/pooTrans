// frontend/src/components/lobby/OverviewTab.tsx
import React, { useEffect, useState } from "react";
import { getLobbyStats, getLobbyFriends, getLobbyRecentMatches } from "../../utils/lobbyApi";

interface Stats {
  totalMatches: number;
  winRate: number;
  currentWinStreak: number;
  monthlyWins: number;
  wins: number;
  losses: number;
}

interface Friend {
  id: number;
  name: string;
  status: string;
  rank: number;
  lastActive: string;
}

interface Match {
  id: string;
  opponent: string;
  result: string;
  score: string;
  matchType: string;
  date: string;
  duration: string;
}

export const OverviewTab: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [fetchedStats, fetchedFriends, fetchedMatches] = await Promise.all([
          getLobbyStats(),
          getLobbyFriends(),
          getLobbyRecentMatches()
        ]);

        setStats(fetchedStats);
        setFriends(fetchedFriends);
        setRecentMatches(fetchedMatches);
      } catch (err: any) {
        console.error("Error fetching overview data:", err);
        setError("Failed to load overview data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Error Loading Overview</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Online friends only
  const onlineFriends = friends?.filter(f => f.status === "online" || f.status === "in-game") || [];
  
  // Helper functions for status color/text
  const getStatusColor = (status: string) =>
    status === "online" ? "bg-green-400" : status === "in-game" ? "bg-yellow-400" : "bg-gray-400";
  
  const getStatusText = (status: string) =>
    status === "online" ? "Online" : status === "in-game" ? "In Game" : "Offline";
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Stats */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-300">⚡ Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Total Matches:</span>
            <span className="font-bold">{stats?.totalMatches ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Win Rate:</span>
            <span className="font-bold text-green-400">{stats?.winRate ?? 0}%</span>
          </div>
          <div className="flex justify-between">
            <span>Win Streak:</span>
            <span className="font-bold text-yellow-400">{stats?.currentWinStreak ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>This Month:</span>
            <span className="font-bold text-purple-400">{stats?.monthlyWins ?? 0}W</span>
          </div>
        </div>
      </div>

      {/* Online Friends */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-green-300">🟢 Online Squad</h3>
        <div className="space-y-2">
          {onlineFriends.length > 0 ? (
            onlineFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(friend.status)}`}></div>
                <span className="flex-1">{friend.name}</span>
                <span className="text-xs text-gray-400">{getStatusText(friend.status)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No friends online</p>
          )}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-purple-300">🎯 Recent Matches</h3>
        <div className="space-y-2">
          {recentMatches && recentMatches.length > 0 ? (
            recentMatches.slice(0, 3).map((match) => (
              <div key={match.id} className="flex items-center justify-between text-sm">
                <span>vs {match.opponent}</span>
                <div className="text-right">
                  <div className={`font-bold ${
                    match.result === 'win' ? 'text-green-400' : 
                    match.result === 'loss' ? 'text-red-400' : 
                    'text-yellow-400'
                  }`}>
                    {match.result.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-400">{match.score}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No recent matches</p>
          )}
        </div>
      </div>
    </div>
  );
};