import React from 'react';
import { Target, Calendar, Clock, TrendingDown } from 'lucide-react';

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + offset);
  
  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const calculateTimeRemaining = (deadline) => {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const timeDiff = deadlineDate - today;
  
  if (timeDiff <= 0) return { days: 0, weeks: 0, months: 0 };
  
  return {
    days: Math.ceil(timeDiff / (1000 * 60 * 60 * 24)),
    weeks: Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7)),
    months: Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30))
  };
};

const FitnessOverview = ({ goal, weightLogs, timeDisplayMode, setTimeDisplayMode, onEditGoal }) => {
  if (!goal) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8 text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Set Your Fitness Goal</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by setting your target weight and deadline</p>
        <button
          onClick={onEditGoal}
          className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          Set Fitness Goal
        </button>
      </div>
    );
  }

  const timeRemaining = calculateTimeRemaining(goal.deadline);
  const startingWeight = goal.starting_weight || (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0);
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : startingWeight;
  const weightLoss = startingWeight - currentWeight;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-6 h-6 mr-2" />
            <span className="text-sm font-medium opacity-90">Target Weight</span>
          </div>
          <div className="text-3xl font-bold">{goal.target_weight} lbs</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-6 h-6 mr-2" />
            <span className="text-sm font-medium opacity-90">Target Date</span>
          </div>
          <div className="text-3xl font-bold">{formatDisplayDate(goal.deadline)}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingDown className="w-6 h-6 mr-2" />
            <span className="text-sm font-medium opacity-90">Weight Loss</span>
          </div>
          <div className="text-3xl font-bold">{weightLoss.toFixed(1)} lbs</div>
        </div>
        
        {timeRemaining && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <span className="text-sm font-medium opacity-90">Time Remaining</span>
            </div>
            <button
              onClick={() => {
                if (timeDisplayMode === 'days') setTimeDisplayMode('weeks');
                else if (timeDisplayMode === 'weeks') setTimeDisplayMode('months');
                else setTimeDisplayMode('days');
              }}
              className="text-3xl font-bold hover:opacity-80 transition-opacity cursor-pointer"
            >
              {timeDisplayMode === 'days' && `${timeRemaining.days} days`}
              {timeDisplayMode === 'weeks' && `${timeRemaining.weeks} weeks`}
              {timeDisplayMode === 'months' && `${timeRemaining.months} months`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessOverview;