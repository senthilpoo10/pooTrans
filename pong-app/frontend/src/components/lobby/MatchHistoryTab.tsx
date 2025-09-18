// // frontend/src/components/lobby/MatchHistoryTab.tsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getLobbyRecentMatches, getLobbyProfile } from "../../utils/lobbyApi";

// interface Match {
//   id: string;
//   opponent: string;
//   result: string;
//   score: string;
//   playedAt: string;
// }

// interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   wins: number;
//   losses: number;
//   avatarUrl?: string;
// }

// export const MatchHistoryTab = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [matches, setMatches] = useState<Match[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [fetchedProfile, fetchedMatches] = await Promise.all([
//           getLobbyProfile(),
//           getLobbyRecentMatches()
//         ]);

//         setProfile(fetchedProfile);
//         setMatches(fetchedMatches);
//       } catch (err) {
//         console.error("Error during data fetching:", err);
//         setError("Failed to load match history");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const toggleMatchDetails = (matchId: string) => {
//     setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
//   };

//   const adjustToTimezone = (dateString: string): string => {
//     const date = new Date(dateString);
    
//     // Format the date manually
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     const seconds = String(date.getSeconds()).padStart(2, "0");

//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   };

//   if (loading) {
//     return (
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="text-center text-gray-400">Loading match history...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="text-center">
//             <div className="text-red-400 mb-4">{error}</div>
//             <button 
//               onClick={() => window.location.reload()}
//               className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="bg-gray-800 rounded-xl p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-3xl font-bold text-white">Game History</h2>
//           <button 
//             onClick={() => window.location.reload()}
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
//           >
//             Refresh
//           </button>
//         </div>

//         {/* User Stats Summary */}
//         {profile && (
//           <div className="bg-gray-700 rounded-lg p-4 mb-6">
//             <div className="flex items-center gap-4">
//               <img
//                 src={profile.avatarUrl || "/avatars/default-avatar.png"}
//                 alt={profile.name}
//                 className="w-16 h-16 rounded-full border-2 border-white object-cover"
//               />
//               <div>
//                 <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
//                 <div className="flex gap-4 text-sm text-gray-300">
//                   <span>Wins: <span className="text-green-400">{profile.wins}</span></span>
//                   <span>Losses: <span className="text-red-400">{profile.losses}</span></span>
//                   <span>Total: <span className="text-blue-400">{profile.wins + profile.losses}</span></span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Match History */}
//         <div className="space-y-4">
//           {matches.length > 0 ? (
//             matches.map((match) => (
//               <div key={match.id} className="bg-gray-700 rounded-lg overflow-hidden">
//                 {/* Match Header */}
//                 <button
//                   onClick={() => toggleMatchDetails(match.id)}
//                   className={`w-full p-4 text-left hover:bg-gray-600 transition-colors ${
//                     expandedMatchId === match.id ? 'bg-blue-600' : 'bg-gray-700'
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="text-white font-medium">
//                       {adjustToTimezone(match.playedAt)} - vs {match.opponent}
//                     </span>
//                     <span className={`px-2 py-1 rounded text-xs ${
//                       match.result === 'win' ? 'bg-green-600' : 
//                       match.result === 'loss' ? 'bg-red-600' : 
//                       'bg-yellow-600'
//                     }`}>
//                       {match.result.toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="text-gray-400 text-sm mt-1">
//                     Score: {match.score}
//                   </div>
//                 </button>

//                 {/* Expanded Match Details */}
//                 {expandedMatchId === match.id && (
//                   <div className="p-6 bg-gray-800">
//                     <h3 className="text-xl font-bold mb-4 text-white">Game Details</h3>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div className="bg-gray-700 p-4 rounded-lg">
//                         <h4 className="font-semibold text-white mb-2">Match Information</h4>
//                         <div className="space-y-2 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Opponent:</span>
//                             <span className="text-white">{match.opponent}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Result:</span>
//                             <span className={
//                               match.result === 'win' ? 'text-green-400' : 
//                               match.result === 'loss' ? 'text-red-400' : 
//                               'text-yellow-400'
//                             }>{match.result.toUpperCase()}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Score:</span>
//                             <span className="text-white">{match.score}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Date:</span>
//                             <span className="text-white">{adjustToTimezone(match.playedAt)}</span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="bg-gray-700 p-4 rounded-lg">
//                         <h4 className="font-semibold text-white mb-2">Performance</h4>
//                         <div className="space-y-2 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Match Duration:</span>
//                             <span className="text-white">N/A</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Game Type:</span>
//                             <span className="text-white">Ping Pong</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Points Won:</span>
//                             <span className="text-white">N/A</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Placeholder for future round data */}
//                     <div className="mt-4 p-4 bg-gray-700 rounded-lg">
//                       <p className="text-gray-400 text-center">
//                         Detailed round statistics will be available soon
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           ) : (
//             <div className="text-center text-gray-400 py-8">
//               <p>No match history available</p>
//               <p className="text-sm mt-2">Play some games to see your history here!</p>
//             </div>
//           )}
//         </div>

//         {/* Match Count */}
//         {matches.length > 0 && (
//           <div className="mt-4 text-center text-gray-400 text-sm">
//             Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };



// // frontend/src/components/lobby/MatchHistoryTab.tsx
// // frontend/src/components/lobby/MatchHistoryTab.tsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getLobbyRecentMatches, getLobbyProfile } from "../../utils/lobbyApi";

// interface Match {
//   id: string;
//   opponent: string;
//   result: string;
//   score: string;
//   playedAt: string;
//   matchType: string;
//   duration: string;
//   rounds_json?: any; // For detailed game data if available
// }

// interface UserProfile {
//   id: string;
//   name: string;
//   email: string;
//   wins: number;
//   losses: number;
//   profilePic?: string;
// }

// interface GameMatch {
//   player1: { name: string; avatar: string; wins: number };
//   player2: { name: string; avatar: string; wins: number };
//   winner?: { name: string };
// }

// interface DetailedGame {
//   id_game: number;
//   date: string;
//   game_name: string;
//   rounds_json: GameMatch[][];
// }

// export const MatchHistoryTab = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [matches, setMatches] = useState<Match[]>([]);
//   const [detailedGames, setDetailedGames] = useState<DetailedGame[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
//   const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

//   // Avatar mapping - you might want to import this from a shared file
//   const avatars = [
//     { name: 'default', image: '/profile-pics/default-profile.jpg' },
//     { name: 'AstroAce', image: '/avatars/astro-ace.png' },
//     { name: 'PixelPirate', image: '/avatars/pixel-pirate.png' },
//     { name: 'RoboRacer', image: '/avatars/robo-racer.png' },
//     { name: 'ShadowNinja', image: '/avatars/shadow-ninja.png' },
//     // Add more avatars as needed
//   ];

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const [fetchedProfile, fetchedMatches] = await Promise.all([
//           getLobbyProfile(),
//           getLobbyRecentMatches()
//         ]);

//         setProfile(fetchedProfile);
//         setMatches(fetchedMatches);

//         // If you have access to detailed game data, fetch it here
//         // This would require a new API endpoint similar to getUserGames in GameStats
//         // For now, we'll work with the basic match data

//       } catch (err: any) {
//         console.error("Error during data fetching:", err);
//         setError("Failed to load match history");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const findAvatar = (avatarName: string): string => {
//     const avatar = avatars.find((avatar) => avatar?.name === avatarName);
//     return avatar ? avatar.image : "/profile-pics/default-profile.jpg";
//   };

//   const adjustToTimezone = (dateString: string): string => {
//     const date = new Date(dateString);
    
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const hours = String(date.getHours()).padStart(2, "0");
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     const seconds = String(date.getSeconds()).padStart(2, "0");

//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   };

//   const renderTournamentBracket = (rounds_json: GameMatch[][]): JSX.Element => {
//     return (
//       <div className="tournament-bracket grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
//         {rounds_json.map((round, index) => (
//           <div key={index} className="round bg-gray-700 p-4 rounded-lg">
//             <h4 className="text-white text-center mb-3 font-semibold">
//               Round {index + 1}
//             </h4>
//             {round.map((match, matchIndex) => (
//               <div
//                 key={matchIndex}
//                 className="match bg-gray-600 p-3 rounded-lg mb-3 last:mb-0"
//               >
//                 <div className="player flex items-center mb-2">
//                   <img
//                     src={findAvatar(match.player1.avatar)}
//                     alt={match.player1.name}
//                     className="w-8 h-8 rounded-full mr-2 border border-gray-400"
//                   />
//                   <span className="text-white text-sm">
//                     {match.player1.name} <span className="text-green-400">{match.player1.wins || 0}</span>
//                   </span>
//                 </div>
//                 <div className="player flex items-center">
//                   <img
//                     src={findAvatar(match.player2.avatar)}
//                     alt={match.player2.name}
//                     className="w-8 h-8 rounded-full mr-2 border border-gray-400"
//                   />
//                   <span className="text-white text-sm">
//                     {match.player2.name} <span className="text-green-400">{match.player2.wins || 0}</span>
//                   </span>
//                 </div>
//                 {match.winner && (
//                   <div className="text-center mt-2 text-xs text-yellow-400">
//                     Winner: {match.winner.name}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const toggleMatchDetails = (matchId: string) => {
//     setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
//   };

//   const getResultColor = (result: string) => {
//     switch (result) {
//       case 'win': return 'text-green-400 bg-green-900';
//       case 'loss': return 'text-red-400 bg-red-900';
//       default: return 'text-yellow-400 bg-yellow-900';
//     }
//   };

//   const getMatchTypeIcon = (matchType: string) => {
//     switch (matchType) {
//       case 'pingpong': return '🏓';
//       case 'keyclash': return '⌨️';
//       case 'tournament': return '🏆';
//       default: return '🎮';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="animate-pulse">
//             <div className="h-8 bg-gray-700 rounded mb-6"></div>
//             <div className="space-y-4">
//               {[...Array(5)].map((_, i) => (
//                 <div key={i} className="h-16 bg-gray-700 rounded"></div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="max-w-6xl mx-auto">
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="text-center">
//             <div className="text-red-400 mb-4">{error}</div>
//             <button 
//               onClick={() => window.location.reload()}
//               className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="bg-gray-800 rounded-xl p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-3xl font-bold text-white">Match History</h2>
//           <div className="flex gap-2">
//             <button
//               onClick={() => setViewMode(viewMode === 'simple' ? 'detailed' : 'simple')}
//               className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
//             >
//               {viewMode === 'simple' ? 'Detailed View' : 'Simple View'}
//             </button>
//             <button 
//               onClick={() => window.location.reload()}
//               className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
//             >
//               Refresh
//             </button>
//           </div>
//         </div>

//         {/* User Stats Summary */}
//         {profile && (
//           <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-6 mb-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <img
//                   src={profile.profilePic || "/profile-pics/default-profile.jpg"}
//                   alt={profile.name}
//                   className="w-16 h-16 rounded-full border-2 border-white object-cover"
//                 />
//                 <div>
//                   <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
//                   <p className="text-gray-300">{profile.email}</p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="grid grid-cols-3 gap-4 text-center">
//                   <div>
//                     <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
//                     <div className="text-xs text-gray-300">Wins</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
//                     <div className="text-xs text-gray-300">Losses</div>
//                   </div>
//                   <div>
//                     <div className="text-2xl font-bold text-blue-400">{profile.wins + profile.losses}</div>
//                     <div className="text-xs text-gray-300">Total</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Match History List */}
//         <div className="space-y-4">
//           {matches.length > 0 ? (
//             matches.map((match) => (
//               <div key={match.id} className="bg-gray-700 rounded-lg overflow-hidden">
//                 {/* Match Header */}
//                 <button
//                   onClick={() => toggleMatchDetails(match.id)}
//                   className={`w-full p-4 text-left hover:bg-gray-600 transition-colors ${
//                     expandedMatchId === match.id ? 'bg-gray-600' : 'bg-gray-700'
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center gap-4">
//                       <span className="text-2xl">{getMatchTypeIcon(match.matchType)}</span>
//                       <div>
//                         <div className="text-white font-medium">
//                           vs {match.opponent}
//                         </div>
//                         <div className="text-gray-400 text-sm">
//                           {adjustToTimezone(match.playedAt)} • {match.duration}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResultColor(match.result)}`}>
//                         {match.result.toUpperCase()}
//                       </span>
//                       <div className="text-white font-mono">
//                         {match.score}
//                       </div>
//                       <svg 
//                         className={`w-5 h-5 text-gray-400 transition-transform ${
//                           expandedMatchId === match.id ? 'rotate-180' : ''
//                         }`} 
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </div>
//                   </div>
//                 </button>

//                 {/* Expanded Match Details */}
//                 {expandedMatchId === match.id && (
//                   <div className="bg-gray-800 p-6 border-t border-gray-600">
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                       {/* Match Information */}
//                       <div className="bg-gray-700 p-4 rounded-lg">
//                         <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
//                           <span>📊</span> Match Details
//                         </h4>
//                         <div className="space-y-3">
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Game Type:</span>
//                             <span className="text-white capitalize">{match.matchType}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Opponent:</span>
//                             <span className="text-white">{match.opponent}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Result:</span>
//                             <span className={match.result === 'win' ? 'text-green-400' : 'text-red-400'}>
//                               {match.result.toUpperCase()}
//                             </span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Score:</span>
//                             <span className="text-white font-mono">{match.score}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Duration:</span>
//                             <span className="text-white">{match.duration}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Date:</span>
//                             <span className="text-white">{adjustToTimezone(match.playedAt)}</span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Performance Stats */}
//                       <div className="bg-gray-700 p-4 rounded-lg">
//                         <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
//                           <span>⚡</span> Performance
//                         </h4>
//                         <div className="space-y-3">
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Match ID:</span>
//                             <span className="text-white font-mono text-xs">{match.id}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Points Scored:</span>
//                             <span className="text-white">-</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Accuracy:</span>
//                             <span className="text-white">-</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Best Streak:</span>
//                             <span className="text-white">-</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-400">Avg Response:</span>
//                             <span className="text-white">-</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Tournament Bracket (if detailed game data is available) */}
//                     {match.rounds_json && viewMode === 'detailed' && (
//                       <div className="mt-6">
//                         <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
//                           <span>🏆</span> Tournament Bracket
//                         </h4>
//                         {renderTournamentBracket(match.rounds_json)}
//                       </div>
//                     )}

//                     {/* Placeholder for when detailed data is not available */}
//                     {!match.rounds_json && viewMode === 'detailed' && (
//                       <div className="mt-6 p-6 bg-gray-700 rounded-lg text-center">
//                         <div className="text-gray-400 mb-2">
//                           <span className="text-4xl">📊</span>
//                         </div>
//                         <p className="text-gray-400">
//                           Detailed match statistics will be available soon
//                         </p>
//                         <p className="text-gray-500 text-sm mt-1">
//                           Enhanced analytics and round-by-round data coming in future updates
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-12 bg-gray-700 rounded-lg">
//               <div className="text-6xl mb-4">🎮</div>
//               <h3 className="text-xl font-semibold text-white mb-2">No matches yet</h3>
//               <p className="text-gray-400 mb-4">Start playing to see your match history here!</p>
//               <button
//                 onClick={() => navigate('/quickmatch')}
//                 className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
//               >
//                 Play Now
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Footer Stats */}
//         {matches.length > 0 && (
//           <div className="mt-6 pt-4 border-t border-gray-600">
//             <div className="flex justify-between items-center text-sm text-gray-400">
//               <span>
//                 Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
//               </span>
//               <div className="flex gap-4">
//                 <span>
//                   Wins: {matches.filter(m => m.result === 'win').length}
//                 </span>
//                 <span>
//                   Losses: {matches.filter(m => m.result === 'loss').length}
//                 </span>
//                 <span>
//                   Win Rate: {matches.length > 0 ? 
//                     Math.round((matches.filter(m => m.result === 'win').length / matches.length) * 100) : 0
//                   }%
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };




// frontend/src/components/lobby/MatchHistoryTab.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface Match {
  id: string;
  gameType: string;
  opponent: string;
  result: string;
  score: string;
  duration: string;
  date: string;
  mode: string;
}

interface PlayerStats {
  username: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  currentStreak: number;
  memberSince: string;
}

export const MatchHistoryTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchHistory();
    fetchPlayerStats();
  }, []);

  const fetchMatchHistory = async () => {
    try {
      const response = await fetch('/api/games/recent-matches?limit=20', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        setError('Failed to fetch match history');
      }
    } catch (error) {
      setError('Error fetching match history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch(`/api/games/stats/${user?.username}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading match history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-white p-8">
      <button
        onClick={() => navigate("/lobby")}
        className="absolute top-6 left-6 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold shadow-md"
      >
        🔙 Back to Lobby
      </button>

      <h1 className="text-4xl font-bold text-center mb-8">
        🏆 Match History & Statistics
      </h1>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      {/* Player Statistics */}
      {stats && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Player Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
              <div className="text-sm">Wins</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-400">{stats.losses}</div>
              <div className="text-sm">Losses</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">{stats.totalMatches}</div>
              <div className="text-sm">Total Matches</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-3xl font-bold text-yellow-400">{stats.winRate}%</div>
              <div className="text-sm">Win Rate</div>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-400">
            Member since: {new Date(stats.memberSince).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Match History */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Recent Matches</h2>
        
        {matches.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No matches played yet. Start playing to see your history here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">Game</th>
                  <th className="p-3">Opponent</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Mode</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className="border-b border-gray-600 hover:bg-gray-700">
                    <td className="p-3">{formatDate(match.date)}</td>
                    <td className="p-3 capitalize">{match.gameType}</td>
                    <td className="p-3">{match.opponent}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded ${
                        match.result === 'win' 
                          ? 'bg-green-500 text-white' 
                          : match.result === 'loss' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {match.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{match.score}</td>
                    <td className="p-3">{match.duration}</td>
                    <td className="p-3 capitalize">{match.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}