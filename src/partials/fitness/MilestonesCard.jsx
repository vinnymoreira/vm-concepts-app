import React from 'react';
import { Target } from 'lucide-react';

const MilestonesCard = ({ goal, weightLogs, milestones }) => {
  const calculateMilestones = () => {
    // If we have custom milestones from the database, use those
    if (milestones && milestones.length > 0 && weightLogs.length > 0) {
      const currentWeight = weightLogs[0].weight;
      const startingWeight = goal.starting_weight || weightLogs[weightLogs.length - 1].weight;
      
      return milestones.map((milestone, index) => {
        const isCompleted = currentWeight <= milestone.target_weight;
        
        // Check if previous milestones are completed (for sequential logic)
        const previousMilestonesCompleted = index === 0 ? true : 
          milestones.slice(0, index).every((prevMilestone) => 
            currentWeight <= prevMilestone.target_weight
          );
        
        // Current milestone is the first incomplete one
        const isCurrent = !isCompleted && previousMilestonesCompleted;
        
        // Calculate progress for current milestone only
        let progressPercentage = 0;
        if (isCurrent && index > 0) {
          const previousMilestoneWeight = milestones[index - 1].target_weight;
          const currentMilestoneWeight = milestone.target_weight;
          const weightToLose = previousMilestoneWeight - currentMilestoneWeight;
          const weightLost = previousMilestoneWeight - currentWeight;
          progressPercentage = Math.max(0, Math.min(100, (weightLost / weightToLose) * 100));
        } else if (isCurrent && index === 0) {
          // For first milestone, calculate from starting weight
          const weightToLose = startingWeight - milestone.target_weight;
          const weightLost = startingWeight - currentWeight;
          progressPercentage = Math.max(0, Math.min(100, (weightLost / weightToLose) * 100));
        }
        
        return {
          target: milestone.target_weight.toFixed(1),
          completed: isCompleted,
          current: isCurrent,
          milestoneNumber: milestone.milestone_number,
          progressPercentage: Math.round(progressPercentage)
        };
      });
    }
    
    // Fallback to auto-calculated milestones if no custom ones exist
    if (!goal || weightLogs.length === 0) return null;
    
    const startingWeight = goal.starting_weight || weightLogs[weightLogs.length - 1].weight;
    const targetWeight = goal.target_weight;
    const currentWeight = weightLogs[0].weight;
    const totalDifference = startingWeight - targetWeight;
    const milestoneCount = 4;
    const milestoneSize = totalDifference / milestoneCount;
    
    return Array.from({ length: milestoneCount }, (_, i) => {
      const milestoneWeight = startingWeight - (milestoneSize * (i + 1));
      const isCompleted = currentWeight <= milestoneWeight;
      
      // Check if previous milestones are completed
      const previousMilestonesCompleted = i === 0 ? true :
        Array.from({ length: i }, (_, j) => {
          const prevMilestoneWeight = startingWeight - (milestoneSize * (j + 1));
          return currentWeight <= prevMilestoneWeight;
        }).every(Boolean);
      
      const isCurrent = !isCompleted && previousMilestonesCompleted;
      
      // Calculate progress for current milestone only
      let progressPercentage = 0;
      if (isCurrent && i > 0) {
        const previousMilestoneWeight = startingWeight - (milestoneSize * i);
        const currentMilestoneWeight = milestoneWeight;
        const weightToLose = previousMilestoneWeight - currentMilestoneWeight;
        const weightLost = previousMilestoneWeight - currentWeight;
        progressPercentage = Math.max(0, Math.min(100, (weightLost / weightToLose) * 100));
      } else if (isCurrent && i === 0) {
        const weightToLose = startingWeight - milestoneWeight;
        const weightLost = startingWeight - currentWeight;
        progressPercentage = Math.max(0, Math.min(100, (weightLost / weightToLose) * 100));
      }
      
      return {
        target: milestoneWeight.toFixed(1),
        completed: isCompleted,
        current: isCurrent,
        milestoneNumber: i + 1,
        progressPercentage: Math.round(progressPercentage)
      };
    });
  };

  const milestoneData = calculateMilestones();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        Milestones
      </h2>
      {goal && weightLogs.length > 0 ? (
        <div className="space-y-4">
          {/* Top Row - Starting Weight, Target Weight, Weight Loss */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <span className="block text-sm text-gray-600 dark:text-gray-400">Starting Weight</span>
              <span className="block text-lg font-semibold text-blue-600 dark:text-blue-400">
                {goal.starting_weight || weightLogs[weightLogs.length - 1].weight} lbs
              </span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-600 dark:text-gray-400">Target Weight</span>
              <span className="block text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {goal.target_weight} lbs
              </span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-600 dark:text-gray-400">Weight Loss</span>
              <span className="block text-lg font-semibold text-green-600 dark:text-green-400">
                {((goal.starting_weight || weightLogs[weightLogs.length - 1].weight) - weightLogs[0].weight).toFixed(1)} lbs
              </span>
            </div>
          </div>
          
          {/* Milestone Cards */}
          {milestoneData && milestoneData.map((milestone, index) => (
            <div key={milestone.milestoneNumber || index} className={`p-4 rounded-lg border-2 transition-all ${
              milestone.completed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : milestone.current 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="block font-medium text-gray-800 dark:text-gray-100">
                    Milestone {milestone.milestoneNumber || index + 1}
                  </span>
                  <span className="block text-sm text-gray-600 dark:text-gray-400">
                    Target: {milestone.target} lbs
                  </span>
                </div>
                {milestone.completed ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">Achieved</span>
                  </div>
                ) : milestone.current ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {milestone.progressPercentage}% Complete
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 font-medium">
                    {milestone.progressPercentage}% Complete
                  </span>
                )}
              </div>
              {milestone.current && milestone.progressPercentage > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${milestone.progressPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Set a goal and log weights to see milestones</p>
        </div>
      )}
    </div>
  );
};

export default MilestonesCard;