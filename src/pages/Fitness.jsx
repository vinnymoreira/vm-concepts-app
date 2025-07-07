import React, { useState, useEffect } from 'react';
import { Plus, Edit3 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import FitnessOverview from '../partials/fitness/FitnessOverview';
import WeightProgressChart from '../partials/fitness/WeightProgressChart';
import MilestonesCard from '../partials/fitness/MilestonesCard';
import ProgressHistoryCard from '../partials/fitness/ProgressHistoryCard';
import LogWeightModal from '../partials/fitness/LogWeightModal';
import EditGoalModal from '../partials/fitness/EditGoalModal';

function Fitness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goal, setGoal] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetWeight, setTargetWeight] = useState('');
  const [deadline, setDeadline] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [timeDisplayMode, setTimeDisplayMode] = useState('days');
  const [milestones, setMilestones] = useState([]);

  // ✅ Get user and initialized from useAuth
  const { user, initialized } = useAuth();

  // ✅ Fixed useEffect with proper dependencies and cleanup
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
        
        // Fetch goal
        const { data: goalData } = await supabase
          .from('fitness_goals')
          .select('*')
          .eq('user_id', user.id)  // ✅ Filter by user
          .single();
        
        if (isMounted) {
          setGoal(goalData);
          if (goalData) {
            setTargetWeight(goalData.target_weight);
            setDeadline(goalData.deadline);
            
            // Fetch milestones if they exist
            if (goalData.enable_milestones) {
              const { data: milestonesData } = await supabase
                .from('fitness_milestones')
                .select('*')
                .eq('goal_id', goalData.id)
                .order('milestone_number');
              
              setMilestones(milestonesData || []);
            }
          }
        }

        // Fetch weight logs
        const { data: logsData } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)  // ✅ Filter by user
          .order('log_date', { ascending: false });
        
        if (isMounted) {
          setWeightLogs(logsData || []);
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

  const handleSetGoal = async (goalData) => {
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
        starting_date: goalData.startingDate
      };

      // Explicitly set the boolean value for enable_milestones
      // This ensures no automatic camelCase conversion issues
      dbGoalData['enable_milestones'] = Boolean(goalData.enableMilestones);
      
      if (goal) {
        // Update existing goal
        const updateData = {
          ...dbGoalData,
          updated_at: new Date().toISOString()
        };
        
        
        const { error } = await supabase
          .from('fitness_goals')
          .update(updateData)
          .eq('id', goal.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        goalId = goal.id;
        
        // Delete existing milestones
        const { error: deleteError } = await supabase
          .from('fitness_milestones')
          .delete()
          .eq('goal_id', goal.id);
          
        if (deleteError) {
          console.error('Delete milestones error:', deleteError);
          // Don't throw here, just log
        }
          
      } else {
        // Create new goal
        
        const { data: newGoal, error } = await supabase
          .from('fitness_goals')
          .insert([dbGoalData]) // Wrap in array to be explicit
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
      
      // Close modal and refresh data
      setIsEditGoalModalOpen(false);
      
      // Manually refresh the data instead of calling fetchFitnessData
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch updated goal
        const { data: goalData } = await supabase
          .from('fitness_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setGoal(goalData);
        if (goalData) {
          setTargetWeight(goalData.target_weight);
          setDeadline(goalData.deadline);
          
          // Fetch milestones if they exist
          if (goalData.enable_milestones) {
            const { data: milestonesData } = await supabase
              .from('fitness_milestones')
              .select('*')
              .eq('goal_id', goalData.id)
              .order('milestone_number');
            
            setMilestones(milestonesData || []);
          }
        }

        // Fetch weight logs
        const { data: logsData } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false });
        
        setWeightLogs(logsData || []);
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
      
      
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
      
      // Delete the goal
      const { error } = await supabase
        .from('fitness_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id); // Ensure user owns the goal
      
      if (error) throw error;
      
      // Reset state
      setGoal(null);
      setTargetWeight('');
      setDeadline('');
      setMilestones([]);
      setIsEditGoalModalOpen(false);
      
      
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert(`Error deleting goal: ${error.message}`);
    }
  };

  const handleLogWeight = async () => {
    if (!user) {
      setError('You must be logged in to log weight.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .insert([{
          weight: parseFloat(currentWeight),
          log_date: logDate,
          user_id: user.id  // ✅ Add user_id
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
              </div>
              <div className="flex space-x-2">
                {goal && (
                  <button
                    onClick={() => setIsEditGoalModalOpen(true)}
                    className="btn bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 hover:border-gray-400 flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Goal
                  </button>
                )}
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Weight
                </button>
              </div>
            </div>

            {/* Fitness Goal Display or Setup */}
            <FitnessOverview 
              goal={goal}
              weightLogs={weightLogs}
              timeDisplayMode={timeDisplayMode}
              setTimeDisplayMode={setTimeDisplayMode}
              onEditGoal={() => setIsEditGoalModalOpen(true)}
            />

            {/* Weight Progress Chart */}
            <WeightProgressChart 
              goal={goal}
              weightLogs={weightLogs}
            />

            {/* Bottom Grid - Milestones and Progress History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Enhanced Milestones Card */}
              <MilestonesCard 
                goal={goal}
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
        onSave={handleSetGoal}
        onDelete={handleDeleteGoal} // ✅ Add this line
        goal={goal}
        weightLogs={weightLogs}
        existingMilestones={milestones}
      />
    </div>
  );
}

export default Fitness;