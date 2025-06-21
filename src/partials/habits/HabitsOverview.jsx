import React from 'react';
import { CheckCircle, Target, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'indigo' }) => {
  const iconColorClasses = {
    indigo: 'text-indigo-600',
    green: 'text-emerald-600',
    red: 'text-rose-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  };

  const bgClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/50',
    green: 'bg-emerald-50 dark:bg-emerald-950/50',
    red: 'bg-rose-50 dark:bg-rose-950/50',
    orange: 'bg-orange-50 dark:bg-orange-950/50',
    purple: 'bg-purple-50 dark:bg-purple-950/50'
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`${bgClasses[color]} p-4 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">
              {title}
            </h3>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {value}
              </div>
              {subtitle && (
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HabitsOverview = ({ 
  totalHabits, 
  completedToday, 
  totalSpentToday, 
  totalSavedToday,
  healthyHabits, 
  unhealthyHabits 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Healthy Habits */}
      <StatCard
        icon={TrendingUp}
        title="Healthy Habits"
        value={healthyHabits}
        subtitle="active habits"
        color="green"
      />

      {/* Unhealthy Habits */}
      <StatCard
        icon={TrendingDown}
        title="Vices Tracked"
        value={unhealthyHabits}
        subtitle="being monitored"
        color="red"
      />

      {/* Money Saved Today */}
      <StatCard
        icon={DollarSign}
        title="Money Saved"
        value={`${totalSavedToday.toFixed(2)}`}
        subtitle="avoided spending"
        color="green"
      />

      {/* Completed Today */}
      <StatCard
        icon={CheckCircle}
        title="Completed"
        value={completedToday}
        subtitle="habits today"
        color="purple"
      />
    </div>
  );
};

export default HabitsOverview;