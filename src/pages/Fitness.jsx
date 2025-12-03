import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Target, Archive, TrendingUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { migrateFitnessData, checkMigrationStatus } from '../utils/fitnessMigration';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import FitnessOverview from '../partials/fitness/FitnessOverview';
import WeightProgressChart from '../partials/fitness/WeightProgressChart';
import MilestonesCard from '../partials/fitness/MilestonesCard';
import ProgressHistoryCard from '../partials/fitness/ProgressHistoryCard';
import LogWeightModal from '../partials/fitness/LogWeightModal';
import EditGoalModal from '../partials/fitness/EditGoalModal';
import GoalComparison from '../partials/fitness/GoalComparison';

function Fitness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetWeight, setTargetWeight] = useState('');
  const [deadline, setDeadline] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [timeDisplayMode, setTimeDisplayMode] = useState('days');
  const [milestones, setMilestones] = useState([]);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showGoalComparison, setShowGoalComparison] = useState(false);

  // ✅ Get user and initialized from useAuth
  const { user, initialized } = useAuth();

  // Enhanced useEffect for multi-goal support with migration
  useEffect(() => {
    let isMounted = true;

    const fetchFitnessData = async () => {
      if (!user || !initialized) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Check migration status and migrate if needed
        const migrationCheck = await checkMigrationStatus(user.id);
        if (migrationCheck.migrationNeeded) {
          console.log('Migration needed, starting migration...');
          await migrateFitnessData(user.id);
        }
        
        // Fetch all goals
        const { data: goalsData } = await supabase
          .from('fitness_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (isMounted) {
          setGoals(goalsData || []);
          
          // Set active goal (first active goal or first goal)
          const activeGoalData = goalsData?.find(g => g.status === 'active') || goalsData?.[0];
          setActiveGoal(activeGoalData);
          
          if (activeGoalData) {
            setTargetWeight(activeGoalData.target_weight);
            setDeadline(activeGoalData.deadline);
            
            // Fetch milestones for active goal
            if (activeGoalData.enable_milestones) {
              const { data: milestonesData } = await supabase
                .from('fitness_milestones')
                .select('*')
                .eq('goal_id', activeGoalData.id)
                .order('milestone_number');
              
              setMilestones(milestonesData || []);
            } else {
              setMilestones([]);
            }
            
            // Fetch weight logs for active goal
            const { data: logsData } = await supabase
              .from('weight_logs')
              .select('*')
              .eq('user_id', user.id)
              .eq('goal_id', activeGoalData.id)
              .order('log_date', { ascending: false });
            
            setWeightLogs(logsData || []);
          } else {
            // No goals, clear data
            setMilestones([]);
            setWeightLogs([]);
          }
        }
      } catch (error) {
        console.error('Error fetching fitness data:', error);
        if (isMounted) {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFitnessData();

    return () => {
      isMounted = false;
    };
  }, [user, initialized]);

  const handleSetGoal = async (goalData, isNewGoal = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      let goalId;
      
      // Create the data object with explicit snake_case column names
      const dbGoalData = {
        user_id: user.id,
        target_weight: parseFloat(goalData.targetWeight),
        deadline: goalData.deadline,
        starting_weight: parseFloat(goalData.startingWeight),
        starting_date: goalData.startingDate,
        name: goalData.name || 'My Fitness Goal',
        status: goalData.status || 'active'
      };

      // Explicitly set the boolean value for enable_milestones
      dbGoalData['enable_milestones'] = Boolean(goalData.enableMilestones);
      
      if (activeGoal && !isNewGoal) {
        // Update existing goal
        const updateData = {
          ...dbGoalData,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('fitness_goals')
          .update(updateData)
          .eq('id', activeGoal.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        goalId = activeGoal.id;
        
        // Delete existing milestones
        const { error: deleteError } = await supabase
          .from('fitness_milestones')
          .delete()
          .eq('goal_id', activeGoal.id);
          
        if (deleteError) {
          console.error('Delete milestones error:', deleteError);
        }
          
      } else {
        // Create new goal
        // If creating new goal, deactivate others if this is set as active
        if (dbGoalData.status === 'active') {
          await supabase
            .from('fitness_goals')
            .update({ status: 'archived' })
            .eq('user_id', user.id)
            .eq('status', 'active');
        }
        
        const { data: newGoal, error } = await supabase
          .from('fitness_goals')
          .insert([dbGoalData])
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        if (!newGoal) {
          throw new Error('Failed to create goal - no data returned');
        }
        
        goalId = newGoal.id;
      }
      
      // Save milestones if enabled
      if (goalData.enableMilestones && goalData.milestones && goalData.milestones.length > 0) {
        const milestonesToSave = goalData.milestones.map(milestone => ({
          goal_id: goalId,
          milestone_number: parseInt(milestone.id),
          target_weight: parseFloat(milestone.weight)
        }));
        
        const { error: milestonesError } = await supabase
          .from('fitness_milestones')
          .insert(milestonesToSave);
        
        if (milestonesError) {
          console.error('Milestones error:', milestonesError);
          throw milestonesError;
        }
      }
      
      // Close modals and refresh data
      setIsEditGoalModalOpen(false);
      setIsNewGoalModalOpen(false);
      
      // Refresh all data
      await refreshFitnessData();
      
    } catch (error) {
      console.error('Error saving goal:', error);
      alert(`Error saving goal: ${error.message}`);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Delete associated milestones first
      const { error: milestonesError } = await supabase
        .from('fitness_milestones')
        .delete()
        .eq('goal_id', goalId);
      
      if (milestonesError) {
        console.error('Error deleting milestones:', milestonesError);
      }
      
      // Archive weight logs instead of deleting them
      const { error: logsError } = await supabase
        .from('weight_logs')
        .update({ goal_id: null })
        .eq('goal_id', goalId)
        .eq('user_id', user.id);
      
      if (logsError) {
        console.error('Error archiving weight logs:', logsError);
      }
      
      // Delete the goal
      const { error } = await supabase
        .from('fitness_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Close modals and refresh data
      setIsEditGoalModalOpen(false);
      await refreshFitnessData();
      
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert(`Error deleting goal: ${error.message}`);
    }
  };

  // Refresh function for reusing data fetching logic
  const refreshFitnessData = async () => {
    if (!user) return;

    try {
      // Fetch all goals
      const { data: goalsData } = await supabase
        .from('fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setGoals(goalsData || []);

      // Prioritize active goal, then fall back to current goal if it still exists
      const currentActiveGoal = goalsData?.find(g => g.status === 'active') ||
                               goalsData?.find(g => g.id === activeGoal?.id) ||
                               goalsData?.[0];

      setActiveGoal(currentActiveGoal);
      
      if (currentActiveGoal) {
        setTargetWeight(currentActiveGoal.target_weight);
        setDeadline(currentActiveGoal.deadline);
        
        // Fetch milestones for active goal
        if (currentActiveGoal.enable_milestones) {
          const { data: milestonesData } = await supabase
            .from('fitness_milestones')
            .select('*')
            .eq('goal_id', currentActiveGoal.id)
            .order('milestone_number');
          
          setMilestones(milestonesData || []);
        } else {
          setMilestones([]);
        }
        
        // Fetch weight logs for active goal
        const { data: logsData } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('goal_id', currentActiveGoal.id)
          .order('log_date', { ascending: false });
        
        setWeightLogs(logsData || []);
      } else {
        setMilestones([]);
        setWeightLogs([]);
        setTargetWeight('');
        setDeadline('');
      }
    } catch (error) {
      console.error('Error refreshing fitness data:', error);
      setError(error.message);
    }
  };

  const handleLogWeight = async () => {
    if (!user) {
      setError('You must be logged in to log weight.');
      return;
    }
    
    if (!activeGoal) {
      setError('Please create a fitness goal first.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .insert([{
          weight: parseFloat(currentWeight),
          log_date: logDate,
          user_id: user.id,
          goal_id: activeGoal.id
        }])
        .select()
        .single();

      if (error) throw error;

      setWeightLogs(prev => [data, ...prev]);
      setCurrentWeight('');
      setLogDate(new Date().toISOString().split('T')[0]);
      setIsLogModalOpen(false);
    } catch (error) {
      console.error('Error logging weight:', error);
      setError(error.message);
    }
  };

  const saveEditedLog = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .update({
          weight: parseFloat(editWeight),
          log_date: editDate
        })
        .eq('id', editingLogId)
        .eq('user_id', user.id)  // ✅ Security check
        .select()
        .single();

      if (error) throw error;

      setWeightLogs(prev => prev.map(log => log.id === editingLogId ? data : log));
      setEditingLogId(null);
      setEditWeight('');
      setEditDate('');
    } catch (error) {
      console.error('Error updating weight log:', error);
      setError(error.message);
    }
  };

  const cancelEditing = () => {
    setEditingLogId(null);
    setEditWeight('');
    setEditDate('');
  };

  const deleteWeightLog = async (logId) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this weight log?')) {
      try {
        const { error } = await supabase
          .from('weight_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', user.id);  // ✅ Security check

        if (error) throw error;

        setWeightLogs(prev => prev.filter(log => log.id !== logId));
      } catch (error) {
        console.error('Error deleting weight log:', error);
        setError(error.message);
      }
    }
  };

  const handleGoalSwitch = async (goalId) => {
    const selectedGoal = goals.find(g => g.id === goalId);
    if (!selectedGoal) return;
    
    setActiveGoal(selectedGoal);
    setTargetWeight(selectedGoal.target_weight);
    setDeadline(selectedGoal.deadline);
    
    try {
      // Fetch milestones for selected goal
      if (selectedGoal.enable_milestones) {
        const { data: milestonesData } = await supabase
          .from('fitness_milestones')
          .select('*')
          .eq('goal_id', selectedGoal.id)
          .order('milestone_number');
        
        setMilestones(milestonesData || []);
      } else {
        setMilestones([]);
      }
      
      // Fetch weight logs for selected goal
      const { data: logsData } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_id', selectedGoal.id)
        .order('log_date', { ascending: false });
      
      setWeightLogs(logsData || []);
    } catch (error) {
      console.error('Error switching goal:', error);
      setError(error.message);
    }
    
    setShowGoalSelector(false);
  };

  const handleArchiveGoal = async (goalId) => {
    try {
      const { error } = await supabase
        .from('fitness_goals')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refreshFitnessData();
    } catch (error) {
      console.error('Error archiving goal:', error);
      alert(`Error archiving goal: ${error.message}`);
    }
  };

  const handleReactivateGoal = async (goalId) => {
    try {
      // Deactivate current active goal
      await supabase
        .from('fitness_goals')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      // Activate selected goal
      const { error } = await supabase
        .from('fitness_goals')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refreshFitnessData();
    } catch (error) {
      console.error('Error reactivating goal:', error);
      alert(`Error reactivating goal: ${error.message}`);
    }
  };

  // ✅ Show loading while auth initializes
  if (!initialized) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show auth required message
  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to track your fitness goals.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show data loading spinner
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <span className="ml-2">Loading fitness data...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Fitness</h1>
                {/* Goal selector */}
                {goals.length > 1 && (
                  <div className="mt-2 relative">
                    <button
                      onClick={() => setShowGoalSelector(!showGoalSelector)}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      {activeGoal ? activeGoal.name : 'Select Goal'}
                      <span className="ml-1">▼</span>
                    </button>
                    {showGoalSelector && (
                      <div className="absolute top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        <div className="p-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Active Goals</div>
                          {goals.filter(g => g.status === 'active').map(goal => (
                            <button
                              key={goal.id}
                              onClick={() => handleGoalSwitch(goal.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                activeGoal?.id === goal.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''
                              }`}
                            >
                              {goal.name}
                            </button>
                          ))}
                          {goals.filter(g => g.status === 'archived').length > 0 && (
                            <>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2 font-medium">Archived Goals</div>
                              {goals.filter(g => g.status === 'archived').map(goal => (
                                <div key={goal.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                  <button
                                    onClick={() => handleGoalSwitch(goal.id)}
                                    className="flex-1 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                  >
                                    {goal.name}
                                  </button>
                                  <button
                                    onClick={() => handleReactivateGoal(goal.id)}
                                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                    title="Reactivate"
                                  >
                                    Reactivate
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                {goals.length > 1 && (
                  <button
                    onClick={() => setShowGoalComparison(true)}
                    className="btn bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center"
                  >
                    <TrendingUp className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Compare Goals</span>
                    <span className="sm:hidden ml-1">Compare</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNewGoalModalOpen(true)}
                  className="btn bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
                >
                  <Target className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Goal</span>
                  <span className="sm:hidden ml-1">New</span>
                </button>
                {activeGoal && (
                  <>
                    <button
                      onClick={() => setIsEditGoalModalOpen(true)}
                      className="btn bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:border-gray-400 flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit Goal</span>
                      <span className="sm:hidden ml-1">Edit</span>
                    </button>
                    <button
                      onClick={() => setIsLogModalOpen(true)}
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Log Weight</span>
                      <span className="sm:hidden ml-1">Log</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Fitness Goal Display or Setup */}
            {!activeGoal ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center mb-8">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Create Your First Fitness Goal
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Set a target weight and track your progress with detailed analytics and milestones.
                </p>
                <button
                  onClick={() => setIsNewGoalModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center mx-auto"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Create Goal
                </button>
              </div>
            ) : (
              <>
                <FitnessOverview 
                  goal={activeGoal}
                  weightLogs={weightLogs}
                  timeDisplayMode={timeDisplayMode}
                  setTimeDisplayMode={setTimeDisplayMode}
                  onEditGoal={() => setIsEditGoalModalOpen(true)}
                  onArchiveGoal={() => handleArchiveGoal(activeGoal.id)}
                  goals={goals}
                />

                {/* Weight Progress Chart */}
                <WeightProgressChart 
                  goal={activeGoal}
                  weightLogs={weightLogs}
                />

                {/* Bottom Grid - Milestones and Progress History */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Enhanced Milestones Card */}
                  <MilestonesCard 
                    goal={activeGoal}
                    weightLogs={weightLogs}
                    milestones={milestones}
                  />

                  {/* Enhanced Progress History Card */}
                  <ProgressHistoryCard 
                    weightLogs={weightLogs}
                    editingLogId={editingLogId}
                    setEditingLogId={setEditingLogId}
                    editWeight={editWeight}
                    setEditWeight={setEditWeight}
                    editDate={editDate}
                    setEditDate={setEditDate}
                    onSaveEdit={saveEditedLog}
                    onCancelEdit={cancelEditing}
                    onDeleteLog={deleteWeightLog}
                    onLogWeight={() => setIsLogModalOpen(true)}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LogWeightModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLogWeight={handleLogWeight}
        currentWeight={currentWeight}
        setCurrentWeight={setCurrentWeight}
        logDate={logDate}
        setLogDate={setLogDate}
      />

      <EditGoalModal
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
        targetWeight={targetWeight}
        setTargetWeight={setTargetWeight}
        deadline={deadline}
        setDeadline={setDeadline}
        onSave={(goalData) => handleSetGoal(goalData, false)}
        onDelete={handleDeleteGoal}
        goal={activeGoal}
        weightLogs={weightLogs}
        existingMilestones={milestones}
      />

      <EditGoalModal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        targetWeight=''
        setTargetWeight={() => {}}
        deadline=''
        setDeadline={() => {}}
        onSave={(goalData) => handleSetGoal(goalData, true)}
        onDelete={() => {}}
        goal={null}
        weightLogs={weightLogs}
        existingMilestones={[]}
        isNewGoal={true}
      />

      <GoalComparison
        isOpen={showGoalComparison}
        onClose={() => setShowGoalComparison(false)}
        goals={goals}
        userId={user?.id}
      />
    </div>
  );
}

export default Fitness;