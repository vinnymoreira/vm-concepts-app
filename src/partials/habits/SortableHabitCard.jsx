import React from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import HabitCard from './HabitCard';

const SortableHabitCard = ({ habit, habitLogs, onLogHabit, onDeleteLog, onHabitClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
      >
        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center shadow-sm transition-colors">
          <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      
      {/* Habit Card */}
      <HabitCard
        habit={habit}
        habitLogs={habitLogs}
        onLogHabit={onLogHabit}
        onDeleteLog={onDeleteLog}
        onHabitClick={onHabitClick}
      />
    </div>
  );
};

export default SortableHabitCard;