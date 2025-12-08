import React, { useState, useMemo } from 'react';
import { Trash2, Edit, ChevronUp, ChevronDown, Home } from 'lucide-react';

function RentalPropertyTable({ records, properties, onRowClick, onDelete }) {
  const [sortField, setSortField] = useState('record_date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-indigo-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-indigo-500" />
    );
  };

  // Join property data with records
  const recordsWithProperty = useMemo(() => {
    return records.map(record => {
      const property = properties.find(p => p.id === record.property_id);
      return {
        ...record,
        property_name: property?.property_name || 'Unknown Property'
      };
    });
  }, [records, properties]);

  const sortedRecords = useMemo(() => {
    return [...recordsWithProperty].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle different data types
      if (sortField === 'record_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (['rental_income', 'total_expenses', 'net_profit'].includes(sortField)) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [recordsWithProperty, sortField, sortDirection]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const calculateTotalExpenses = (record) => {
    return (
      parseFloat(record.mortgage || 0) +
      parseFloat(record.maintenance || 0) +
      parseFloat(record.property_management || 0) +
      parseFloat(record.other_expenses || 0)
    );
  };

  const handleDelete = (record) => {
    if (window.confirm(`Are you sure you want to delete the record for ${record.property_name} - ${formatDate(record.record_date)}?`)) {
      onDelete(record.id);
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Home className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No rental records found.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Add your first monthly record to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('record_date')}
              >
                <div className="flex items-center gap-1">
                  Month
                  {getSortIcon('record_date')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('property_name')}
              >
                <div className="flex items-center gap-1">
                  Property
                  {getSortIcon('property_name')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('rental_income')}
              >
                <div className="flex items-center justify-end gap-1">
                  Income
                  {getSortIcon('rental_income')}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Expenses
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('net_profit')}
              >
                <div className="flex items-center justify-end gap-1">
                  Net Profit
                  {getSortIcon('net_profit')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRecords.map((record) => {
              const totalExpenses = calculateTotalExpenses(record);
              const netProfit = parseFloat(record.rental_income || 0) - totalExpenses;
              const isVacant = parseFloat(record.rental_income || 0) === 0;

              return (
                <tr
                  key={record.id}
                  onClick={() => onRowClick(record)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(record.record_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.property_name}</span>
                      {isVacant && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Vacant
                        </span>
                      )}
                    </div>
                    {record.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {record.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(record.rental_income || 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                    netProfit >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(record);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RentalPropertyTable;
