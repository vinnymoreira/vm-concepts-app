import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit3, Plus } from 'lucide-react';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import FitnessOverview from '../partials/fitness/FitnessOverview';
import WeightProgressChart from '../partials/fitness/WeightProgressChart';
import MilestonesCard from '../partials/fitness/MilestonesCard';
import ProgressHistoryCard from '../partials/fitness/ProgressHistoryCard';
import LogWeightModal from '../partials/fitness/LogWeightModal';
import EditGoalModal from '../partials/fitness/EditGoalModal';

// Simplified date functions
const getTodayDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

function Fitness() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goal, setGoal] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [logDate, setLogDate] = useState(getTodayDateString());
  const [targetWeight, setTargetWeight] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [timeDisplayMode, setTimeDisplayMode] = useState('days');
  const [milestones, setMilestones] = useState([]);

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
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    }
  };

  const handleSetGoal = async (goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let goalId;
      
      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('fitness_goals')
          .update({
            target_weight: parseFloat(goalData.targetWeight),
            deadline: goalData.deadline,
            starting_weight: goalData.startingWeight,
            starting_date: goalData.startingDate,
            enable_milestones: goalData.enableMilestones,
            updated_at: new Date().toISOString()
          })
          .eq('id', goal.id);
        
        if (error) throw error;
        goalId = goal.id;
        
        // Delete existing milestones
        await supabase
          .from('fitness_milestones')
          .delete()
          .eq('goal_id', goal.id);
          
      } else {
        // Create new goal
        const { data: newGoal, error } = await supabase
          .from('fitness_goals')
          .insert({
            user_id: user.id,
            target_weight: parseFloat(goalData.targetWeight),
            deadline: goalData.deadline,
            starting_weight: goalData.startingWeight,
            starting_date: goalData.startingDate,
            enable_milestones: goalData.enableMilestones
          })
          .select()
          .single();
        
        if (error) throw error;
        goalId = newGoal.id;
      }
      
      // Save milestones if enabled
      if (goalData.enableMilestones && goalData.milestones.length > 0) {
        const milestonesToSave = goalData.milestones.map(milestone => ({
          goal_id: goalId,
          milestone_number: milestone.id,
          target_weight: parseFloat(milestone.weight)
        }));
        
        const { error: milestonesError } = await supabase
          .from('fitness_milestones')
          .insert(milestonesToSave);
        
        if (milestonesError) throw milestonesError;
      }
      
      fetchFitnessData();
      setIsEditGoalModalOpen(false);
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  };

  const handleLogWeight = async () => {
    try {
      if (!currentWeight) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('weight_logs')
        .insert({
          user_id: user.id,
          weight: parseFloat(currentWeight),
          log_date: logDate
        });
      
      if (error) throw error;
      
      setCurrentWeight('');
      setIsLogModalOpen(false);
      fetchFitnessData();
    } catch (error) {
      console.error('Error logging weight:', error);
      alert(`Error: ${error.message}`);
    }
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
    if (window.confirm('Are you sure you want to delete this weight log?')) {
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
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Header with Action Buttons */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Fitness Tracker</h1>
              </div>
              <div className="flex space-x-3">
                {goal && (
                  <button
                    onClick={() => setIsEditGoalModalOpen(true)}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white flex items-center"
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
        goal={goal}
        weightLogs={weightLogs}
        existingMilestones={milestones}
      />
    </div>
  );
}

export default Fitness;