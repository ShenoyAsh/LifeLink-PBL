import React, { useState, useEffect } from 'react';
import { Trophy, Award, Zap, BarChart2, Heart, ArrowUp, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Leaderboard from './Leaderboard';
import AchievementBadge from './AchievementBadge';
import ProgressBar from './ProgressBar';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivity, setRecentActivity] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/gamification/me');
        const stats = response.data.data;
        setUserStats(stats);
        
        // Simulate recent activity (replace with actual API call)
        setRecentActivity([
          { id: 1, type: 'DONATION', points: 150, description: 'Blood donation completed', date: new Date() },
          { id: 2, type: 'ACHIEVEMENT', points: 200, description: 'Reached Level 5', date: new Date(Date.now() - 86400000) },
          { id: 3, type: 'STREAK', points: 50, description: '3-day donation streak', date: new Date(Date.now() - 172800000) },
        ]);
        
        // Simulate all achievements (replace with actual API call)
        // Use local 'stats' variable to calculate earned status
        setAllAchievements([
          { 
            type: 'FIRST_DONATION', 
            title: 'First Blood', 
            description: 'Complete your first blood donation',
            earned: true,
            earnedAt: new Date(Date.now() - 2592000000)
          },
          { 
            type: 'REGULAR_DONOR', 
            title: 'Regular Donor', 
            description: 'Donate blood 5 times',
            earned: stats?.totalDonations >= 5,
            earnedAt: stats?.totalDonations >= 5 ? new Date(Date.now() - 1296000000) : null
          },
          { 
            type: 'LIFESAVER', 
            title: 'Lifesaver', 
            description: 'Donate blood 10 times',
            earned: stats?.totalDonations >= 10,
            earnedAt: stats?.totalDonations >= 10 ? new Date(Date.now() - 604800000) : null
          },
          { 
            type: 'COMMUNITY_HERO', 
            title: 'Community Hero', 
            description: 'Donate blood 25 times',
            earned: stats?.totalDonations >= 25,
            earnedAt: null
          },
          { 
            type: 'PLATINUM_DONOR', 
            title: 'Platinum Donor', 
            description: 'Donate blood 50 times',
            earned: stats?.totalDonations >= 50,
            earnedAt: null
          },
        ]);
      } catch (error) {
        console.error('Error fetching gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  const getNextLevelPoints = () => {
    if (!userStats) return 0;
    const nextLevel = userStats.level + 1;
    return Math.pow(nextLevel * 10, 3);
  };

  const getLevelProgress = () => {
    if (!userStats) return 0;
    const currentLevelPoints = Math.pow((userStats.level - 1) * 10, 3);
    const nextLevelPoints = getNextLevelPoints();
    const pointsForNextLevel = nextLevelPoints - currentLevelPoints;
    const pointsInCurrentLevel = userStats.points - currentLevelPoints;
    
    return (pointsInCurrentLevel / pointsForNextLevel) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Donor'}</h2>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>Level {userStats?.level || 1}</span>
                  <span className="mx-2">•</span>
                  <span>{userStats?.points?.toLocaleString() || 0} points</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{userStats?.totalDonations || 0}</div>
                  <div className="text-sm text-gray-500">Donations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{userStats?.streak?.count || 0}</div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {userStats?.achievements?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Achievements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="mb-2 flex justify-between text-sm font-medium text-gray-700">
            <span>Level {userStats?.level || 1}</span>
            <span>Level {userStats ? userStats.level + 1 : 2}</span>
          </div>
          <ProgressBar 
            current={userStats?.points || 0} 
            max={getNextLevelPoints()} 
            showPercentage={false}
            height="h-3"
            showLabels={false}
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {getNextLevelPoints() - (userStats?.points || 0)} points to next level
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'achievements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Achievements
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {allAchievements.filter(a => a.earned).length}/{allAchievements.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Leaderboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rewards'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              Rewards
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="bg-white overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <li key={activity.id} className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {activity.type === 'DONATION' && (
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <Heart className="h-5 w-5 text-red-600" />
                                </div>
                              )}
                              {activity.type === 'ACHIEVEMENT' && (
                                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                  <Award className="h-5 w-5 text-yellow-600" />
                                </div>
                              )}
                              {activity.type === 'STREAK' && (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                +{activity.points} pts
                              </span>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-6 py-12 text-center">
                        <p className="text-gray-500">No recent activity</p>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Stats and Next Milestone */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Your Stats</h3>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Points</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {userStats?.points?.toLocaleString() || 0}
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden">
                      <dt className="text-sm font-medium text-gray-500 truncate">Current Level</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {userStats?.level || 1}
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden">
                      <dt className="text-sm font-medium text-gray-500 truncate">Donation Streak</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {userStats?.streak?.count || 0} days
                      </dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden">
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Donations</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {userStats?.totalDonations || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Next Milestone */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Next Milestone</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Trophy className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        {userStats?.nextMilestone?.title || 'Reach Level ' + (userStats ? userStats.level + 1 : 2)}
                      </h4>
                      <div className="mt-2">
                        <ProgressBar 
                          current={getLevelProgress()} 
                          max={100}
                          height="h-2"
                          showLabels={false}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {Math.round(getLevelProgress())}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
                <div className="text-sm text-gray-500">
                  {allAchievements.filter(a => a.earned).length} of {allAchievements.length} unlocked
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allAchievements.map((achievement) => (
                  <AchievementBadge 
                    key={achievement.type} 
                    achievement={achievement}
                    earned={achievement.earned}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Donors</h3>
              <p className="mt-1 text-sm text-gray-500">
                See how you compare to other donors in the community
              </p>
            </div>
            <div className="px-6 py-5">
              <Leaderboard />
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Available Rewards</h3>
              <p className="mt-1 text-sm text-gray-500">
                Redeem your points for exciting rewards and benefits
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="text-center py-12">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for exciting rewards you can redeem with your points.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowUp className="-ml-1 mr-2 h-5 w-5" />
                    Earn More Points
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationDashboard;