import React, { useState } from 'react';
import { Trash2, ExternalLink, User } from 'lucide-react';
import ProjectRow from './ProjectRow';

function ProjectTable({ projects, clients, onUpdate, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'ascending' });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = React.useMemo(() => {
    let sortableProjects = [...projects];
    if (sortConfig.key) {
      sortableProjects.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle null values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Handle dates
        if (sortConfig.key === 'deadline') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        // Handle numbers
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'ascending' ? aVal - bVal : bVal - aVal;
        }

        // Handle strings
        const aString = String(aVal).toLowerCase();
        const bString = String(bVal).toLowerCase();

        if (aString < bString) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aString > bString) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProjects;
  }, [projects, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Name {getSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => handleSort('assigned_to')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Assigned {getSortIcon('assigned_to')}
                </div>
              </th>
              <th
                onClick={() => handleSort('deadline')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Deadline {getSortIcon('deadline')}
                </div>
              </th>
              <th
                onClick={() => handleSort('payment_received')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Paid {getSortIcon('payment_received')}
                </div>
              </th>
              <th
                onClick={() => handleSort('net_income')}
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-end gap-1">
                  Revenue {getSortIcon('net_income')}
                </div>
              </th>
              <th
                onClick={() => handleSort('cost')}
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-end gap-1">
                  Cost {getSortIcon('cost')}
                </div>
              </th>
              <th
                onClick={() => handleSort('profit')}
                className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-end gap-1">
                  Profit {getSortIcon('profit')}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Links
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                clients={clients}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectTable;
