import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ current, max, label, showPercentage = true, height = 'h-2', showLabels = true }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  // Calculate gradient color based on percentage
  const getProgressColor = (percent) => {
    if (percent < 30) return 'from-red-400 to-red-500';
    if (percent < 60) return 'from-yellow-400 to-yellow-500';
    if (percent < 90) return 'from-blue-400 to-blue-500';
    return 'from-green-400 to-green-500';
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{label}</span>
          {showPercentage && (
            <span>{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(percentage)} transition-all duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span className="sr-only">
            {percentage}% {label}
          </span>
        </div>
      </div>
      {showLabels && max && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{current.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  height: PropTypes.string,
  showLabels: PropTypes.bool
};

export default ProgressBar;
