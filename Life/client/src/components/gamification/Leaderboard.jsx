import React, { useState, useEffect } from 'react';
import { Trophy, Award, Users, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../common';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'monthly', 'weekly'

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/gamification/leaderboard', {
          params: {
            page,
            limit: 10,
            range: timeRange
          }
        });

        setLeaderboard(response.data.data);
        setUserStats(response.data.userStats);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [page, timeRange]);

  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankChange = (positionChange) => {
    if (positionChange > 0) {
      return (
        <span className="flex items-center text-green-500">
          <ArrowUp className="h-4 w-4 mr-1" />
          {positionChange}
        </span>
      );
    } else if (positionChange < 0) {
      return (
        <span className="flex items-center text-red-500">
          <ArrowDown className="h-4 w-4 mr-1" />
          {Math.abs(positionChange)}
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-400">
        <Minus className="h-4 w-4 mr-1" />
      </span>
    );
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setPage(1); // Reset to first page when changing time range
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Donor Leaderboard</h3>
            <p className="mt-1 text-sm text-gray-500">
              Top donors making a difference in our community
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button
              variant={timeRange === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleTimeRangeChange('all')}
            >
              All Time
            </Button>
            <Button
              variant={timeRange === 'monthly' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleTimeRangeChange('monthly')}
            >
              This Month
            </Button>
            <Button
              variant={timeRange === 'weekly' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleTimeRangeChange('weekly')}
            >
              This Week
            </Button>
          </div>
        </div>
      </div>

      {/* User's Position */}
      {userStats && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                <span className="text-blue-600 font-bold">#{userStats.rank}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Your Position</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">{userStats.points} points</span>
                  <span className="mx-1">•</span>
                  <span>Level {userStats.level}</span>
                  <span className="mx-1">•</span>
                  <span>{userStats.totalDonations} donations</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {getRankChange(userStats.positionChange)}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {leaderboard.map((donor, index) => (
            <li key={donor._id} className="hover:bg-gray-50">
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center text-gray-500 font-medium">
                    {getRankBadge(index)}
                  </div>
                  <div className="ml-4 flex-1 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                      {donor.avatar ? (
                        <img
                          className="h-full w-full object-cover"
                          src={donor.avatar}
                          alt={donor.name}
                        />
                      ) : (
                        <div className="h-full w-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {donor.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {donor.name}
                        </p>
                        {donor._id === user?._id && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                          Level {donor.level}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-purple-500" />
                          {donor.achievements} achievements
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {donor.points.toLocaleString()} pts
                    </p>
                    <div className="text-xs text-gray-500">
                      {donor.totalDonations} donations
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="ml-3"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * 10, leaderboard.length + (page - 1) * 10)}
                </span>{' '}
                of <span className="font-medium">{totalPages * 10}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
