import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import HabitCard from './HabitCard';
import SortableHabitCard from './SortableHabitCard';

const HabitsGrid = ({ habits, habitLogs = [], onLogHabit, onDeleteLog, onHabitClick, onReorderHabits }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No habits yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Start building better habits by adding your first habit to track.
        </p>
      </div>
    );
  }

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = habits.findIndex(habit => habit.id === active.id);
      const newIndex = habits.findIndex(habit => habit.id === over.id);
      
      const reorderedHabits = arrayMove(habits, oldIndex, newIndex);
      
      // Call the parent's reorder function
      if (onReorderHabits) {
        onReorderHabits(reorderedHabits);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <SortableContext items={habits.map(habit => habit.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {habits.map((habit) => (
            <SortableHabitCard
              key={habit.id}
              habit={habit}
              habitLogs={habitLogs.filter(log => log.habit_id === habit.id)}
              onLogHabit={onLogHabit}
              onDeleteLog={onDeleteLog}
              onHabitClick={onHabitClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default HabitsGrid;