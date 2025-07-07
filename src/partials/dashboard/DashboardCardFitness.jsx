import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingDown, TrendingUp, Calendar, Clock, Scale, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function DashboardCardFitness() {
  const [goal, setGoal] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFitnessData();
    }
  }, [user]);

  const fetchFitnessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch goal
      const { data: goalData, error: goalError } = await supabase
        .from('fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (goalError && goalError.code !== 'PGRST116') {
        throw goalError;
      }
      
      setGoal(goalData);

      // Fetch recent weight logs
      const { data: weightData, error: weightError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(10);
      
      if (weightError) {
        throw weightError;
      }
      
      setWeightLogs(weightData || []);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressData = () => {
    if (!goal || weightLogs.length === 0) return null;
    
    const currentWeight = weightLogs[0].weight;
    const startingWeight = goal.starting_weight || (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight);
    const targetWeight = goal.target_weight;
    
    const totalWeightToLose = Math.abs(startingWeight - targetWeight);
    const weightLostSoFar = Math.abs(startingWeight - currentWeight);
    const progress = totalWeightToLose > 0 ? (weightLostSoFar / totalWeightToLose) * 100 : 0;
    
    return {
      currentWeight,
      startingWeight,
      targetWeight,
      weightLostSoFar,
      remainingWeight: Math.abs(currentWeight - targetWeight),
      progress: Math.min(100, Math.max(0, progress))
    };
  };

  const getWeightTrend = () => {
    if (weightLogs.length < 2) return null;
    
    const recent = weightLogs[0].weight;
    const previous = weightLogs[1].weight;
    const change = recent - previous;
    
    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      isGoodTrend: goal?.target_weight < goal?.starting_weight ? change < 0 : change > 0
    };
  };

  const getDaysRemaining = () => {
    if (!goal?.deadline) return null;
    
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const getWeeklyRate = () => {
    const progressData = getProgressData();
    const daysRemaining = getDaysRemaining();
    
    if (!progressData || !daysRemaining || daysRemaining === 0) return null;
    
    const weeklyRate = (progressData.remainingWeight / daysRemaining) * 7;
    return weeklyRate;
  };

  if (loading) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-5 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-5 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 text-sm">Error loading fitness data</p>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Fitness Progress</h2>
          <Link 
            to="/fitness" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Set Goal
            <span className="text-xs">→</span>
          </Link>
        </header>
        <div className="p-5 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Fitness Goal Set</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Set your target weight and deadline to start tracking progress</p>
          <Link 
            to="/fitness" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Target className="w-4 h-4" />
            Set Fitness Goal
          </Link>
        </div>
      </div>
    );
  }

  const progressData = getProgressData();
  const weightTrend = getWeightTrend();
  const daysRemaining = getDaysRemaining();
  const weeklyRate = getWeeklyRate();

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Fitness Progress</h2>
        <Link 
          to="/fitness" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Details
          <span className="text-xs">→</span>
        </Link>
      </header>
      
      <div className="p-5">
        {progressData ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress to Goal
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {progressData.progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${progressData.progress}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Weight */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {progressData.currentWeight} lbs
                  </span>
                  {weightTrend && (
                    <div className={`flex items-center gap-1 text-xs ${
                      weightTrend.isGoodTrend 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {weightTrend.direction === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : weightTrend.direction === 'down' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      {Math.abs(weightTrend.change).toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Weight */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Target</span>
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {progressData.targetWeight} lbs
                </div>
              </div>

              {/* Lost So Far */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Lost</span>
                </div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {progressData.weightLostSoFar.toFixed(1)} lbs
                </div>
              </div>

              {/* Remaining */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {progressData.remainingWeight.toFixed(1)} lbs
                </div>
              </div>
            </div>

            {/* Timeline & Rate */}
            {daysRemaining !== null && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {daysRemaining > 0 ? `${daysRemaining} days left` : 'Goal deadline passed'}
                  </span>
                </div>
                {weeklyRate && weeklyRate > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{weeklyRate.toFixed(1)} lbs/week</span> needed
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Scale className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">No weight data yet</p>
            <Link 
              to="/fitness" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Log your first weight
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCardFitness;