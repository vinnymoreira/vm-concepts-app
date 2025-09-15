import { supabase } from '../supabaseClient';

/**
 * Migration utility for converting single-goal fitness system to multi-goal system
 * This preserves all existing data while adding new capabilities
 */

export const migrateFitnessData = async (userId) => {
  try {
    console.log('Starting fitness data migration for user:', userId);
    
    // Step 1: Check if user already has new schema (migration already done)
    const { data: existingGoals } = await supabase
      .from('fitness_goals')
      .select('id, name, status')
      .eq('user_id', userId);

    // If goals already have name and status, migration is complete
    if (existingGoals && existingGoals.length > 0 && existingGoals[0].name) {
      console.log('Migration already completed for this user');
      return { success: true, alreadyMigrated: true };
    }

    // Step 2: Get existing goal data
    const { data: legacyGoal } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!legacyGoal) {
      console.log('No existing goal found, no migration needed');
      return { success: true, noDataToMigrate: true };
    }

    // Step 3: Update existing goal with new fields
    const goalUpdateData = {
      name: 'My Fitness Goal',
      status: 'active',
      created_at: legacyGoal.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: goalUpdateError } = await supabase
      .from('fitness_goals')
      .update(goalUpdateData)
      .eq('id', legacyGoal.id);

    if (goalUpdateError) {
      console.error('Error updating goal:', goalUpdateError);
      throw goalUpdateError;
    }

    // Step 4: Associate existing weight logs with the goal
    const { data: existingLogs } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', userId)
      .is('goal_id', null); // Only update logs without goal_id

    if (existingLogs && existingLogs.length > 0) {
      const { error: logsUpdateError } = await supabase
        .from('weight_logs')
        .update({ goal_id: legacyGoal.id })
        .eq('user_id', userId)
        .is('goal_id', null);

      if (logsUpdateError) {
        console.error('Error updating weight logs:', logsUpdateError);
        throw logsUpdateError;
      }

      console.log(`Associated ${existingLogs.length} weight logs with goal`);
    }

    console.log('Migration completed successfully');
    return { 
      success: true, 
      migratedGoal: legacyGoal.id,
      migratedLogs: existingLogs?.length || 0 
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if migration is needed for a user
 */
export const checkMigrationStatus = async (userId) => {
  try {
    const { data: goals } = await supabase
      .from('fitness_goals')
      .select('id, name, status')
      .eq('user_id', userId)
      .limit(1);

    if (!goals || goals.length === 0) {
      return { migrationNeeded: false, reason: 'no_goals' };
    }

    const hasNewFields = goals[0].name !== null && goals[0].name !== undefined;
    return { 
      migrationNeeded: !hasNewFields,
      reason: hasNewFields ? 'already_migrated' : 'needs_migration'
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { migrationNeeded: false, error: error.message };
  }
};

/**
 * Export current goal data (for backup/safety)
 */
export const exportGoalData = async (userId) => {
  try {
    const { data: goals } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', userId);

    const { data: logs } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true });

    const { data: milestones } = await supabase
      .from('fitness_milestones')
      .select('*')
      .in('goal_id', goals?.map(g => g.id) || []);

    const exportData = {
      goals,
      weightLogs: logs,
      milestones,
      exportDate: new Date().toISOString(),
      userId
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: error.message };
  }
};