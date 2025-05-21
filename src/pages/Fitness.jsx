import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import LineChartFitnessTracker from '../charts/LineChartFitnessTracker';

// Simplified date functions
const getTodayDateString = () => {
  const now = new Date();
  // Adjust for timezone offset to get local date
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  // Add timezone offset to ensure we're working with local date
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + offset);
  
  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};


function Fitness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goal, setGoal] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [logDate, setLogDate] = useState(getTodayDateString());
  const [targetWeight, setTargetWeight] = useState('');
  const [deadline, setDeadline] = useState('');

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
      if (goalData) {
        setTargetWeight(goalData.target_weight);
        setDeadline(goalData.deadline);
      }

      // Fetch weight logs
      const { data: logsData } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });
      
      setWeightLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    }
  };

  const handleSetGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (goal) {
        const { error } = await supabase
          .from('fitness_goals')
          .update({
            target_weight: parseFloat(targetWeight),
            deadline: deadline,
            updated_at: new Date().toISOString()
          })
          .eq('id', goal.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fitness_goals')
          .insert({
            user_id: user.id,
            target_weight: parseFloat(targetWeight),
            deadline: deadline
          });
        
        if (error) throw error;
      }
      
      fetchFitnessData();
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  };

  const handleLogWeight = async () => {
    try {
      if (!currentWeight) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the exact date from the state
      const { error } = await supabase
        .from('weight_logs')
        .insert({
          user_id: user.id,
          weight: parseFloat(currentWeight),
          log_date: logDate
        });
      
      if (error) throw error;
      
      setCurrentWeight('');
      fetchFitnessData();
    } catch (error) {
      console.error('Error logging weight:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const [editingLogId, setEditingLogId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');

  const startEditing = (log) => {
    setEditingLogId(log.id);
    setEditWeight(log.weight.toString());
    setEditDate(log.log_date);
  };

  const cancelEditing = () => {
    setEditingLogId(null);
    setEditWeight('');
    setEditDate('');
  };

  const saveEditedLog = async () => {
    try {
      if (!editWeight) return;
      
      const { error } = await supabase
        .from('weight_logs')
        .update({
          weight: parseFloat(editWeight),
          log_date: editDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLogId);
      
      if (error) throw error;
      
      fetchFitnessData();
      cancelEditing();
    } catch (error) {
      console.error('Error updating weight log:', error);
    }
  };

  const deleteWeightLog = async (logId) => {
    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', logId);
      
      if (error) throw error;
      
      fetchFitnessData();
    } catch (error) {
      console.error('Error deleting weight log:', error);
    }
  };

  // calculate milestones
  const calculateMilestones = () => {
    if (!goal || weightLogs.length === 0) return null;
    
    const startingWeight = weightLogs[weightLogs.length - 1].weight;
    const currentWeight = weightLogs[0].weight;
    const targetWeight = goal.target_weight;
    const totalDifference = startingWeight - targetWeight;
    const milestoneCount = 4;
    const milestoneSize = totalDifference / milestoneCount;
    const lowestWeight = Math.min(...weightLogs.map(log => log.weight));
    
    return Array.from({ length: milestoneCount }, (_, i) => {
      const milestoneWeight = startingWeight - (milestoneSize * (i + 1));
      const isCompleted = lowestWeight <= milestoneWeight;
      const isCurrent = !isCompleted && (i === 0 || lowestWeight <= startingWeight - (milestoneSize * i));
      
      return {
        target: milestoneWeight.toFixed(1),
        completed: isCompleted,
        current: isCurrent
      };
    });
  };

  const [timeDisplayMode, setTimeDisplayMode] = useState('days');

  const calculateTimeRemaining = () => {
    if (!goal?.deadline) return null;
    
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    const timeDiff = deadlineDate - today;
    
    if (timeDiff <= 0) return { days: 0, weeks: 0, months: 0 };
    
    return {
      days: Math.ceil(timeDiff / (1000 * 60 * 60 * 24)),
      weeks: Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7)),
      months: Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30))
    };
  };

  const prepareChartData = () => {
    if (!goal || weightLogs.length === 0) return null;

    const sortedLogs = [...weightLogs].sort((a, b) => 
      new Date(a.log_date) - new Date(b.log_date)
    );

    // Create projected path data
    const projectedData = [];
    if (sortedLogs.length >= 2) {
      projectedData.push({
        x: sortedLogs[sortedLogs.length - 1].log_date,
        y: sortedLogs[sortedLogs.length - 1].weight
      });
      projectedData.push({
        x: goal.deadline,
        y: goal.target_weight
      });
    }

    return {
      labels: sortedLogs.map(log => log.log_date),
      datasets: [
        {
          label: 'Weight',
          data: sortedLogs.map(log => ({
            x: log.log_date,
            y: log.weight
          })),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        },
        {
          label: 'Target Weight',
          data: sortedLogs.map(log => ({
            x: log.log_date,
            y: goal.target_weight
          })),
          borderColor: '#10B981',
          borderWidth: 2,
          borderDash: [5, 5], // This creates the dashed line
          pointRadius: 0, // Hide points on target line
          backgroundColor: 'rgba(16, 185, 129, 0.05)'
        },
        ...(projectedData.length > 0 ? [{
          label: 'Projected Path',
          data: projectedData,
          borderColor: '#F59E0B',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          tension: 0.1
        }] : [])
      ]
    };
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Title */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Fitness Tracker</h1>
              </div>
            </div>

            {/* Fitness Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goal Setting Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Set Fitness Goal</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="target-weight">
                        Target Weight (lbs)
                      </label>
                      <input
                        id="target-weight"
                        type="number"
                        step="0.1"
                        className="form-input w-full"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="deadline">
                        Target Deadline
                      </label>
                      <input
                        id="deadline"
                        type="date"
                        className="form-input w-full"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                    onClick={handleSetGoal}
                  >
                    {goal ? 'Update Goal' : 'Set Goal'}
                  </button>

                  {/* Goal Summary Section */}
                  {goal && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Current Target</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{goal.target_weight} lbs</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Deadline</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {formatDisplayDate(goal.deadline)}
                          </p>
                        </div>
                      </div>
                      
                      {calculateTimeRemaining() && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Time remaining:
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setTimeDisplayMode('days')}
                                className={`text-xs px-2 py-1 rounded ${timeDisplayMode === 'days' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                              >
                                Days
                              </button>
                              <button
                                onClick={() => setTimeDisplayMode('weeks')}
                                className={`text-xs px-2 py-1 rounded ${timeDisplayMode === 'weeks' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                              >
                                Weeks
                              </button>
                              <button
                                onClick={() => setTimeDisplayMode('months')}
                                className={`text-xs px-2 py-1 rounded ${timeDisplayMode === 'months' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                              >
                                Months
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-2xl font-bold text-indigo-500">
                            {timeDisplayMode === 'days' && `${calculateTimeRemaining().days} days`}
                            {timeDisplayMode === 'weeks' && `${calculateTimeRemaining().weeks} weeks`}
                            {timeDisplayMode === 'months' && `${calculateTimeRemaining().months} months`}
                          </div>
                          {calculateTimeRemaining().days <= 0 && (
                            <div className="mt-1 text-sm text-red-500">Deadline has passed</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {goal && weightLogs.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Weight Progress
                      </h3>
                      <div className="relative h-64">
                        <LineChartFitnessTracker 
                          data={prepareChartData()}
                          width={600}
                          height={250}
                        />
                      </div>
                      <div className="flex justify-center space-x-4 mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">Your Weight</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">Target Weight</span>
                        </div>
                        {weightLogs.length >= 2 && (
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Projected Path</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Milestones Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Milestones</h2>
                {goal && weightLogs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Starting Weight</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {weightLogs[weightLogs.length - 1].weight} lbs
                      </span>
                    </div>
                    
                    {calculateMilestones().map((milestone, index) => (
                      <div key={index} className={`p-3 rounded-lg ${milestone.completed ? 'bg-green-50 dark:bg-green-900/30' : milestone.current ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                              Milestone {index + 1}
                            </span>
                            <span className="block text-xs text-gray-600 dark:text-gray-400">
                              Target: {milestone.target} lbs
                            </span>
                          </div>
                          {milestone.completed ? (
                            <span className="text-green-500 text-sm font-medium">✓ Achieved</span>
                          ) : milestone.current ? (
                            <span className="text-indigo-500 text-sm font-medium">
                              {Math.max(0, Math.min(100, 
                                ((weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight) / 
                                (weightLogs[weightLogs.length - 1].weight - milestone.target)) * 100
                              )).toFixed(0)}% Complete
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">Upcoming</span>
                          )}
                        </div>
                        {milestone.current && (
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full" 
                              style={{ width: `${Math.max(0, Math.min(100, 
                                ((weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight) / 
                                (weightLogs[weightLogs.length - 1].weight - milestone.target)) * 100
                              ))}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex justify-between text-sm mt-3">
                      <span className="text-gray-600 dark:text-gray-400">Target Weight</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {goal.target_weight} lbs
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No goal set or weight data available</p>
                )}
              </div>

              {/* Weight Logging Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Log Current Weight</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="current-weight">
                      Weight (lbs)
                    </label>
                    <input
                      id="current-weight"
                      type="number"
                      step="0.1"
                      className="form-input w-full"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="log-date">
                      Date
                    </label>
                    <input
                      id="log-date"
                      type="date"
                      className="form-input w-full"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                    onClick={handleLogWeight}
                  >
                    Log Weight
                  </button>
                </div>
              </div>

              {/* Progress History Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Progress History</h2>
                {weightLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 text-gray-700 dark:text-gray-300">Date</th>
                          <th className="pb-2 text-gray-700 dark:text-gray-300">Weight (lbs)</th>
                          <th className="pb-2 text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weightLogs
                          .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
                          .map((log) => (
                            <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="py-3 text-gray-800 dark:text-gray-200">
                                {formatDisplayDate(log.log_date)}
                              </td>
                              <td className="py-3 text-gray-800 dark:text-gray-200">
                                {log.weight}
                              </td>
                              <td className="py-3">
                                <div className="flex space-x-2">
                                  <button
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                    onClick={() => startEditing(log)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="text-red-500 hover:text-red-600 text-sm"
                                    onClick={() => deleteWeightLog(log.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No weight logs yet.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Fitness;