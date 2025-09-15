import React, { useState, useEffect } from 'react';
import { TrendingDown, Target, Calendar, BarChart3, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateProgress = (startWeight, currentWeight, targetWeight) => {
  if (!startWeight || !targetWeight) return 0;
  const totalNeeded = Math.abs(startWeight - targetWeight);
  const achieved = Math.abs(startWeight - currentWeight);
  return totalNeeded > 0 ? Math.min(100, (achieved / totalNeeded) * 100) : 0;
};

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const GoalComparison = ({ isOpen, onClose, goals, userId }) => {
  const [goalStats, setGoalStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && goals && goals.length > 0) {
      fetchGoalStats();
    }
  }, [isOpen, goals]);

  const fetchGoalStats = async () => {
    try {
      setLoading(true);
      const stats = [];

      for (const goal of goals) {
        // Fetch weight logs for this goal
        const { data: logs } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('goal_id', goal.id)
          .order('log_date', { ascending: true });

        const currentWeight = logs && logs.length > 0 ? logs[logs.length - 1].weight : goal.starting_weight;
        const weightLoss = goal.starting_weight - currentWeight;
        const progress = calculateProgress(goal.starting_weight, currentWeight, goal.target_weight);
        const duration = calculateDuration(goal.starting_date, logs && logs.length > 0 ? logs[logs.length - 1].log_date : null);
        const averageLossPerWeek = duration > 0 ? (weightLoss / (duration / 7)) : 0;

        stats.push({
          ...goal,
          currentWeight,
          weightLoss,
          progress,
          duration,
          averageLossPerWeek,
          logCount: logs ? logs.length : 0,
          logs
        });
      }

      setGoalStats(stats);
    } catch (error) {
      console.error('Error fetching goal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Goal Comparison & Analysis
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading goal statistics...</span>
            </div>
          ) : goalStats.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Goals to Compare</h3>
              <p className="text-gray-600 dark:text-gray-400">Create multiple goals to see comparison analytics.</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{goalStats.length}</div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Goals</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {goalStats.filter(g => g.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {goalStats.reduce((sum, g) => sum + g.weightLoss, 0).toFixed(1)} lbs
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Total Weight Loss</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(goalStats.reduce((sum, g) => sum + g.averageLossPerWeek, 0) / goalStats.length).toFixed(1)} lbs
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Avg Loss/Week</div>
                </div>
              </div>

              {/* Goal Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Goal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Progress</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Weight Loss</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Avg/Week</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-gray-100">Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalStats.map((goal) => (
                      <tr key={goal.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">{goal.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {goal.starting_weight} → {goal.target_weight} lbs
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(goal.status)}`}>
                            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div 
                                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, goal.progress)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                              {goal.progress.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {goal.weightLoss.toFixed(1)} lbs
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-800 dark:text-gray-100">{goal.duration} days</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDisplayDate(goal.starting_date)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {goal.averageLossPerWeek.toFixed(1)} lbs
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-800 dark:text-gray-100">{goal.logCount}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">entries</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Insights */}
              <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Best Performing Goal */}
                  {(() => {
                    const bestGoal = goalStats.reduce((best, current) => 
                      current.averageLossPerWeek > best.averageLossPerWeek ? current : best
                    );
                    return (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                          🏆 Best Performance
                        </h4>
                        <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{bestGoal.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {bestGoal.averageLossPerWeek.toFixed(1)} lbs per week average
                        </div>
                      </div>
                    );
                  })()}

                  {/* Most Consistent Goal */}
                  {(() => {
                    const mostConsistent = goalStats.reduce((best, current) => 
                      current.logCount > best.logCount ? current : best
                    );
                    return (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                          📊 Most Consistent
                        </h4>
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">{mostConsistent.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {mostConsistent.logCount} weight log entries
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalComparison;