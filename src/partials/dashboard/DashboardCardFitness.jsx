import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function DashboardCardFitness() {
  const [goal, setGoal] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);

  useEffect(() => {
    fetchFitnessData();
  }, []);

  const fetchFitnessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch goal
      const { data: goalData } = await supabase
        .from('fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setGoal(goalData);

      // Fetch latest weight
      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(1)
        .single();
      
      setLatestWeight(weightData);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    }
  };

  const calculateProgress = () => {
    if (!goal || !latestWeight) return null;
    
    const startWeight = latestWeight.weight;
    const targetWeight = goal.target_weight;
    const progress = ((startWeight - latestWeight.weight) / (startWeight - targetWeight)) * 100;
    
    return Math.min(100, Math.max(0, progress)).toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow col-span-12 md:col-span-6 xl:col-span-4">
      <div className="px-5 py-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Fitness Progress</h2>
        {goal && latestWeight ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Current Weight</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{latestWeight.weight} lbs</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Target Weight</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{goal.target_weight} lbs</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(goal.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium text-indigo-500">{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No fitness data available</p>
        )}
      </div>
    </div>
  );
}

export default DashboardCardFitness;