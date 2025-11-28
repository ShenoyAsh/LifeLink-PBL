import React from 'react';
import { Trophy, Award, Heart, Star, CheckCircle } from 'lucide-react';

getIcon = (achievementType) => {
  const iconMap = {
    'FIRST_DONATION': <Trophy className="h-6 w-6 text-yellow-500" />,
    'REGULAR_DONOR': <Award className="h-6 w-6 text-blue-500" />,
    'LIFESAVER': <Heart className="h-6 w-6 text-red-500" />,
    'COMMUNITY_HERO': <Star className="h-6 w-6 text-purple-500" />,
    'PLATINUM_DONOR': <Award className="h-6 w-6 text-indigo-500" />,
  };
  
  return iconMap[achievementType] || <CheckCircle className="h-6 w-6 text-green-500" />;
};

const AchievementBadge = ({ achievement, earned = true, onClick }) => {
  const { type, title, description, earnedAt, icon } = achievement;
  
  const getAchievementCard = () => {
    if (!earned) {
      return (
        <div 
          className={`relative p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${
            onClick ? 'cursor-pointer hover:bg-gray-100' : ''
          }`}
          onClick={onClick}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 text-gray-400">
              {icon || getIcon(type)}
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900">{title}</h4>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className={`relative p-4 rounded-lg border border-gray-200 bg-white shadow-sm ${
          onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon || getIcon(type)}
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <h4 className="text-sm font-medium text-gray-900">{title}</h4>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Earned
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            {earnedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Earned on {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return getAchievementCard();
};

export default AchievementBadge;
