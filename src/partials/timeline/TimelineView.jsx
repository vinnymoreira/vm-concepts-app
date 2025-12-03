import React from 'react';
import { Music, Plane, Award, Heart, Briefcase, GraduationCap, Home, Star, Edit, Trash2 } from 'lucide-react';

const categoryConfig = {
  Music: {
    icon: Music,
    color: 'from-purple-400 to-pink-500',
    bgLight: 'bg-purple-50 dark:bg-purple-900/20',
    borderLight: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  Travel: {
    icon: Plane,
    color: 'from-blue-400 to-cyan-500',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    borderLight: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  Achievement: {
    icon: Award,
    color: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    borderLight: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  Personal: {
    icon: Heart,
    color: 'from-rose-400 to-pink-500',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    borderLight: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
  Work: {
    icon: Briefcase,
    color: 'from-indigo-400 to-blue-500',
    bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderLight: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
  },
  Education: {
    icon: GraduationCap,
    color: 'from-green-400 to-emerald-500',
    bgLight: 'bg-green-50 dark:bg-green-900/20',
    borderLight: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
  },
  Home: {
    icon: Home,
    color: 'from-teal-400 to-cyan-500',
    bgLight: 'bg-teal-50 dark:bg-teal-900/20',
    borderLight: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
  },
  Other: {
    icon: Star,
    color: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50 dark:bg-gray-800/50',
    borderLight: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
};

function TimelineEvent({ event, viewMode, birthDate, onEdit, onDelete, index }) {
  const config = categoryConfig[event.category] || categoryConfig.Other;
  const Icon = config.icon;
  // Fix timezone issue by appending T00:00:00
  const eventDate = new Date(event.event_date + 'T00:00:00');

  // Format date based on precision
  const formatDate = () => {
    const precision = event.date_precision || 'day';
    const year = eventDate.getFullYear();
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
    const day = eventDate.getDate();

    if (precision === 'year') return `${year}`;
    if (precision === 'month') return `${month} ${year}`;
    return `${month} ${day}, ${year}`;
  };

  const formattedDate = formatDate();

  // Calculate age at the time of this event
  const calculateAge = () => {
    if (!birthDate) return null;

    const birth = new Date(birthDate + 'T00:00:00');
    const eventDateObj = new Date(event.event_date + 'T00:00:00');

    let age = eventDateObj.getFullYear() - birth.getFullYear();
    const monthDiff = eventDateObj.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && eventDateObj.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const age = calculateAge();
  const animationDelay = `${index * 0.1}s`;

  if (viewMode === 'horizontal') {
    return (
      <div
        className="group relative flex-shrink-0 w-80"
        style={{ animationDelay }}
      >
        {/* Connector line */}
        <div className="absolute left-1/2 top-0 w-px h-24 bg-gradient-to-b from-transparent via-amber-300/50 to-transparent dark:via-amber-700/50"></div>

        {/* Event marker */}
        <div className="relative flex flex-col items-center">
          {/* Icon circle */}
          <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${config.color} shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8 text-white" />
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}></div>

            {/* Age tooltip */}
            {age !== null && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Age {age}
              </div>
            )}
          </div>

          {/* Date badge */}
          <div className="mt-4 px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            {formattedDate}
          </div>

          {/* Event card */}
          <div className={`mt-4 w-full ${config.bgLight} ${config.borderLight} border rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1`}>
            {/* Category and Age badges */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.bgLight} ${config.borderLight} border rounded-full text-xs font-medium ${config.textColor}`}>
                  <Icon className="w-3 h-3" />
                  {event.category}
                </span>
                {age !== null && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    Age {age}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(event)}
                  className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  title="Edit event"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => onDelete(event.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-serif font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
              {event.title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div
      className="group relative flex gap-6 pb-12 last:pb-0"
      style={{ animationDelay }}
    >
      {/* Timeline line and marker */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        {/* Icon circle */}
        <div className={`relative z-10 w-14 h-14 rounded-full bg-gradient-to-br ${config.color} shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}></div>

          {/* Age tooltip */}
          {age !== null && (
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Age {age}
            </div>
          )}
        </div>

        {/* Vertical connector line */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-amber-300/50 via-orange-300/30 to-transparent dark:from-amber-700/50 dark:via-orange-700/30"></div>
      </div>

      {/* Event content */}
      <div className="flex-1 pt-2">
        {/* Date */}
        <div className="mb-2 px-3 py-1 inline-block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          {formattedDate}
        </div>

        {/* Event card */}
        <div className={`${config.bgLight} ${config.borderLight} border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            {/* Category and Age badges */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bgLight} ${config.borderLight} border rounded-full text-sm font-medium ${config.textColor}`}>
                <Icon className="w-4 h-4" />
                {event.category}
              </span>
              {age !== null && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                  Age {age}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(event)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Edit event"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-serif font-semibold text-gray-800 dark:text-gray-100">
            {event.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function TimelineView({ events, viewMode, birthDate, onEditEvent, onDeleteEvent }) {
  // Calculate birth date from the earliest event
  const calculatedBirthDate = events.length > 0
    ? events.reduce((earliest, event) => {
        const eventDate = new Date(event.event_date + 'T00:00:00');
        const earliestDate = new Date(earliest + 'T00:00:00');
        return eventDate < earliestDate ? event.event_date : earliest;
      }, events[0].event_date)
    : null;

  // Group events by year for better organization
  const eventsByYear = events.reduce((acc, event) => {
    const year = new Date(event.event_date + 'T00:00:00').getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(event);
    return acc;
  }, {});

  const years = Object.keys(eventsByYear).sort((a, b) => b - a);

  if (viewMode === 'horizontal') {
    return (
      <div className="animate-fadeIn">
        {/* Single continuous horizontal timeline */}
        <div className="relative">
          {/* Base timeline line - extends with content */}
          <div className="absolute left-4 right-4 top-8 h-1 bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 dark:from-amber-900 dark:via-orange-900 dark:to-rose-900 rounded-full"></div>

          {/* Events - All in a single horizontal scroll */}
          <div className="flex flex-nowrap gap-8 overflow-x-auto pb-6 pt-16 px-4 scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-amber-700 scrollbar-track-transparent">
            {years.map((year) => {
              const yearEvents = eventsByYear[year];
              const isSingleEvent = yearEvents.length === 1;

              if (isSingleEvent) {
                // Single event: stack year above event
                return (
                  <div key={`year-${year}`} className="flex-shrink-0 flex flex-col items-center gap-4">
                    {/* Year marker on top */}
                    <div className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                      {year}
                    </div>
                    {/* Event below */}
                    <TimelineEvent
                      event={yearEvents[0]}
                      viewMode={viewMode}
                      birthDate={calculatedBirthDate}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                      index={0}
                    />
                  </div>
                );
              }

              // Multiple events: year marker followed by events
              return (
                <React.Fragment key={`year-${year}`}>
                  <div className="flex-shrink-0 flex items-start pt-2">
                    <div className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 px-4">
                      {year}
                    </div>
                  </div>
                  {yearEvents.map((event, index) => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      viewMode={viewMode}
                      birthDate={calculatedBirthDate}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                      index={index}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {years.map((year) => {
        const yearEvents = eventsByYear[year];
        const isSingleEvent = yearEvents.length === 1;

        if (isSingleEvent) {
          // Single event: show year and event side-by-side
          return (
            <div key={year} className="animate-fadeIn">
              <div className="flex items-start gap-6">
                {/* Year on the left */}
                <div className="flex-shrink-0 pt-2">
                  <h2 className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                    {year}
                  </h2>
                </div>

                {/* Single event on the right */}
                <div className="flex-1">
                  <TimelineEvent
                    key={yearEvents[0].id}
                    event={yearEvents[0]}
                    viewMode={viewMode}
                    birthDate={calculatedBirthDate}
                    onEdit={onEditEvent}
                    onDelete={onDeleteEvent}
                    index={0}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Multiple events: traditional vertical layout
        return (
          <div key={year} className="animate-fadeIn">
            {/* Year header */}
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                {year}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent dark:from-amber-700"></div>
            </div>

            {/* Events */}
            <div className="pl-4">
              {yearEvents.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  viewMode={viewMode}
                  birthDate={calculatedBirthDate}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  index={index}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TimelineView;
