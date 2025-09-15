import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

const getTodayDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Enhanced EditGoalModal component with multi-goal support:
const EditGoalModal = ({ 
  isOpen, 
  onClose, 
  targetWeight: initialTargetWeight, 
  setTargetWeight, 
  deadline: initialDeadline, 
  setDeadline, 
  onSave, 
  onDelete,
  goal, 
  weightLogs, 
  existingMilestones,
  isNewGoal = false
}) => {
  const [startingWeight, setStartingWeight] = useState('');
  const [startingDate, setStartingDate] = useState('');
  const [enableMilestones, setEnableMilestones] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(4);
  const [customMilestones, setCustomMilestones] = useState([]);
  const [goalName, setGoalName] = useState('');
  const [goalStatus, setGoalStatus] = useState('active');
  const [targetWeight, setTargetWeightLocal] = useState('');
  const [deadline, setDeadlineLocal] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isNewGoal) {
        // Reset for new goal
        setGoalName('');
        setGoalStatus('active');
        setStartingWeight('');
        setStartingDate(getTodayDateString());
        setTargetWeightLocal(initialTargetWeight || '');
        setDeadlineLocal(initialDeadline || '');
        setEnableMilestones(false);
      } else if (goal && goal.starting_weight && goal.starting_date) {
        // Editing existing goal
        setGoalName(goal.name || '');
        setGoalStatus(goal.status || 'active');
        setStartingWeight(goal.starting_weight.toString());
        setStartingDate(goal.starting_date);
        setTargetWeightLocal(goal.target_weight?.toString() || initialTargetWeight || '');
        setDeadlineLocal(goal.deadline || initialDeadline || '');
        setEnableMilestones(goal.enable_milestones || false);
      } else if (weightLogs && weightLogs.length > 0) {
        // Fallback to earliest log
        const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
        const firstLog = sortedLogs[0];
        setGoalName('');
        setGoalStatus('active');
        setStartingWeight(firstLog.weight.toString());
        setStartingDate(firstLog.log_date);
        setTargetWeightLocal(initialTargetWeight || '');
        setDeadlineLocal(initialDeadline || '');
        setEnableMilestones(false);
      } else {
        // Default values
        setGoalName('');
        setGoalStatus('active');
        setStartingWeight('');
        setStartingDate(getTodayDateString());
        setTargetWeightLocal(initialTargetWeight || '');
        setDeadlineLocal(initialDeadline || '');
        setEnableMilestones(false);
      }
      
      // Load existing milestones or reset
      if (existingMilestones && existingMilestones.length > 0) {
        setMilestoneCount(existingMilestones.length);
        const loadedMilestones = existingMilestones.map(m => ({
          id: m.milestone_number,
          weight: m.target_weight.toString(),
          label: `Milestone ${m.milestone_number}`
        }));
        setCustomMilestones(loadedMilestones);
      } else {
        setMilestoneCount(4);
        setCustomMilestones([]);
      }
    }
  }, [isOpen, goal, weightLogs, existingMilestones]);

  // Calculate suggested milestone weights
  useEffect(() => {
    if (enableMilestones && startingWeight && targetWeight && milestoneCount > 0) {
      const start = parseFloat(startingWeight);
      const target = parseFloat(targetWeight);
      const count = parseInt(milestoneCount);
      
      if (!isNaN(start) && !isNaN(target) && count > 0) {
        // Only auto-calculate if we don't have existing milestones or count changed
        if (customMilestones.length === 0 || customMilestones.length !== count) {
          const weightDifference = start - target;
          const stepSize = weightDifference / count; // Divide by count, not count + 1
          
          const suggestions = [];
          for (let i = 1; i <= count; i++) {
            const suggestedWeight = start - (stepSize * i);
            suggestions.push({
              id: i,
              weight: suggestedWeight.toFixed(1),
              label: `Milestone ${i}`
            });
          }
          setCustomMilestones(suggestions);
        }
      }
    } else if (!enableMilestones) {
      setCustomMilestones([]);
    }
  }, [enableMilestones, startingWeight, targetWeight, milestoneCount]);

  const handleMilestoneWeightChange = (id, newWeight) => {
    setCustomMilestones(prev => 
      prev.map(milestone => 
        milestone.id === id 
          ? { ...milestone, weight: newWeight }
          : milestone
      )
    );
  };

  const handleRemoveMilestone = (milestoneId) => {
    setCustomMilestones(prev => {
      const filtered = prev.filter(milestone => milestone.id !== milestoneId);
      // Reassign IDs to maintain sequence
      const reindexed = filtered.map((milestone, index) => ({
        ...milestone,
        id: index + 1,
        label: `Milestone ${index + 1}`
      }));
      return reindexed;
    });
    setMilestoneCount(prev => Math.max(1, prev - 1));
  };

  const handleMilestoneCountChange = (newCount) => {
    const count = Math.max(1, Math.min(10, parseInt(newCount) || 1));
    setMilestoneCount(count);
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Pass all the data to the save function
    const goalData = {
      name: goalName || (isNewGoal ? 'My Fitness Goal' : goal?.name),
      status: goalStatus,
      targetWeight: targetWeight,
      deadline: deadline,
      startingWeight: parseFloat(startingWeight),
      startingDate,
      enableMilestones,
      milestones: enableMilestones ? customMilestones : []
    };
    
    onSave(goalData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {isNewGoal ? 'Create New Fitness Goal' : goal ? 'Edit Fitness Goal' : 'Set Fitness Goal'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Goal Name and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Goal Name
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="My Fitness Goal"
                  required
                />
              </div>
              {!isNewGoal && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    className="form-select w-full"
                    value={goalStatus}
                    onChange={(e) => setGoalStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
            </div>
            {/* Starting Weight and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Starting Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input w-full"
                  value={startingWeight}
                  onChange={(e) => setStartingWeight(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Starting Date
                </label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={startingDate}
                  onChange={(e) => setStartingDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Target Weight and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Target Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input w-full"
                  value={targetWeight}
                  onChange={(e) => setTargetWeightLocal(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Target Deadline
                </label>
                <input
                  type="date"
                  className="form-input w-full"
                  value={deadline}
                  onChange={(e) => setDeadlineLocal(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Milestones Configuration */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableMilestones"
                    className="form-checkbox text-indigo-600 mr-3"
                    checked={enableMilestones}
                    onChange={(e) => setEnableMilestones(e.target.checked)}
                  />
                  <label htmlFor="enableMilestones" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Create milestone targets
                  </label>
                </div>
                
                {enableMilestones && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Number of milestones:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input w-16 text-sm"
                      value={milestoneCount}
                      onChange={(e) => handleMilestoneCountChange(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {enableMilestones && (
                <div className="space-y-4">
                  {/* Milestone Weight Inputs */}
                  {customMilestones.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Milestone Targets
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customMilestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center space-x-3">
                            <label className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                              {milestone.label}:
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.1"
                                className="form-input w-20 text-sm"
                                value={milestone.weight}
                                onChange={(e) => handleMilestoneWeightChange(milestone.id, e.target.value)}
                              />
                              <span className="text-sm text-gray-500">lbs</span>
                              {customMilestones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMilestone(milestone.id)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove milestone"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Milestone weights are automatically calculated but can be customized.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-8">
            {goal && !isNewGoal && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this fitness goal? This action cannot be undone.')) {
                    onDelete(goal.id);
                  }
                }}
                className="btn bg-red-500 hover:bg-red-600 text-white flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Goal
              </button>
            )}
            
            {/* Right side buttons */}
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {isNewGoal ? 'Create Goal' : goal ? 'Update Goal' : 'Set Goal'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;