import React from 'react';
import { CheckSquare, Plus, Users, Calendar } from 'lucide-react';

const EmptyTaskBoard = ({ onAddColumn }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Illustration */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <CheckSquare className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <Plus className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Ready to Get Organized?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                Create your first task board column to start organizing your work. 
                Whether it's "To Do", "In Progress", or "Done" - you're in control!
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                        <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Organize Tasks
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag and drop tasks between columns
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                        <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Set Due Dates
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Keep track of important deadlines
                    </p>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Rich Details
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add descriptions, checklists, and labels
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <button
                onClick={onAddColumn}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
                <Plus className="w-5 h-5" />
                Create Your First Column
            </button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 max-w-sm">
                Pro tip: Try creating columns like "Today", "This Week", "Next Week", and "Done" to get started!
            </p>
        </div>
    );
};

export default EmptyTaskBoard;