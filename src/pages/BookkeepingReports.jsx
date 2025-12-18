import React, { useState, useEffect, useMemo } from 'react';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function BookkeepingReports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('this_quarter');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { user, initialized } = useAuth();

  const fetchData = async () => {
    if (!user || !initialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('bookkeeping_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('bookkeeping_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: true });

      if (transactionsError) throw transactionsError;

      setCategories(categoriesData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, initialized]);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timePeriod) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(2000, 0, 1);
        endDate = customEndDate ? new Date(customEndDate) : new Date(2099, 11, 31);
        break;
      default:
        startDate = new Date(2000, 0, 1);
        endDate = new Date(2099, 11, 31);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange();

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      return t.transaction_date >= startDate && t.transaction_date <= endDate;
    });
  }, [transactions, startDate, endDate]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const revenueTransactions = filteredTransactions.filter(t => t.type === 'revenue');
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Revenue by category
    const revenueByCategory = {};
    revenueTransactions.forEach(t => {
      revenueByCategory[t.category] = (revenueByCategory[t.category] || 0) + parseFloat(t.amount);
    });

    // Expenses by category
    const expensesByCategory = {};
    expenseTransactions.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
    });

    // Monthly trend data
    const monthlyData = {};
    filteredTransactions.forEach(t => {
      const month = t.transaction_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, expenses: 0 };
      }
      if (t.type === 'revenue') {
        monthlyData[month].revenue += parseFloat(t.amount);
      } else {
        monthlyData[month].expenses += parseFloat(t.amount);
      }
    });

    const monthlyTrend = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueByCategory,
      expensesByCategory,
      monthlyTrend,
      revenueTransactions,
      expenseTransactions
    };
  }, [filteredTransactions]);

  // Prepare chart data
  const expensePieData = Object.entries(analytics.expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: parseFloat(amount.toFixed(2))
  }));

  const revenuePieData = Object.entries(analytics.revenueByCategory).map(([category, amount]) => ({
    name: category,
    value: parseFloat(amount.toFixed(2))
  }));

  const categoryBarData = [
    ...Object.entries(analytics.revenueByCategory).map(([category, amount]) => ({
      category,
      type: 'Revenue',
      amount: parseFloat(amount.toFixed(2))
    })),
    ...Object.entries(analytics.expensesByCategory).map(([category, amount]) => ({
      category,
      type: 'Expense',
      amount: parseFloat(amount.toFixed(2))
    }))
  ];

  // Colors for charts
  const EXPENSE_COLORS = [
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#22C55E',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#EC4899',
    '#F43F5E',
  ];
  
  const REVENUE_COLORS = [
    '#22C55E',
    '#10B981',
    '#06B6D4',
    '#3B82F6',
  ];

  const SPREAD_COLORS = (colors) => {
    const result = [];
    const mid = Math.ceil(colors.length / 2);

    for (let i = 0; i < mid; i++) {
      result.push(colors[i]);
      if (colors[i + mid]) result.push(colors[i + mid]);
    }

    return result;
  };

  const EXPENSE_COLORS_SPREAD = SPREAD_COLORS(EXPENSE_COLORS);



  // Export functions
  const exportToCSV = (type) => {
    let csvContent = '';
    let filename = '';

    if (type === 'summary') {
      // Category Summary Report
      filename = `category-summary-${startDate}-to-${endDate}.csv`;
      csvContent = 'Category,Type,Amount\n';

      Object.entries(analytics.revenueByCategory).forEach(([category, amount]) => {
        csvContent += `"${category}",Revenue,${amount.toFixed(2)}\n`;
      });

      Object.entries(analytics.expensesByCategory).forEach(([category, amount]) => {
        csvContent += `"${category}",Expense,${amount.toFixed(2)}\n`;
      });

      csvContent += `\nTotal Revenue,,${analytics.totalRevenue.toFixed(2)}\n`;
      csvContent += `Total Expenses,,${analytics.totalExpenses.toFixed(2)}\n`;
      csvContent += `Net Profit/Loss,,${analytics.netProfit.toFixed(2)}\n`;

    } else if (type === 'detailed') {
      // Detailed Transaction Report
      filename = `transactions-${startDate}-to-${endDate}.csv`;
      csvContent = 'Date,Type,Merchant,Category,Amount,Description,Source\n';

      filteredTransactions.forEach(t => {
        csvContent += `${t.transaction_date},"${t.type}","${t.merchant}","${t.category}",${t.amount},"${t.description || ''}","${t.source || 'manual'}"\n`;
      });

      csvContent += `\nTotal Revenue,,,,${analytics.totalRevenue.toFixed(2)}\n`;
      csvContent += `Total Expenses,,,,${analytics.totalExpenses.toFixed(2)}\n`;
      csvContent += `Net Profit/Loss,,,,${analytics.netProfit.toFixed(2)}\n`;

    } else if (type === 'pl') {
      // P&L Statement
      filename = `profit-loss-${startDate}-to-${endDate}.csv`;
      csvContent = 'Profit & Loss Statement\n';
      csvContent += `Period: ${startDate} to ${endDate}\n\n`;

      csvContent += 'REVENUE\n';
      csvContent += 'Category,Amount\n';
      Object.entries(analytics.revenueByCategory).forEach(([category, amount]) => {
        csvContent += `"${category}",${amount.toFixed(2)}\n`;
      });
      csvContent += `Total Revenue,${analytics.totalRevenue.toFixed(2)}\n\n`;

      csvContent += 'EXPENSES\n';
      csvContent += 'Category,Amount\n';
      Object.entries(analytics.expensesByCategory).forEach(([category, amount]) => {
        csvContent += `"${category}",${amount.toFixed(2)}\n`;
      });
      csvContent += `Total Expenses,${analytics.totalExpenses.toFixed(2)}\n\n`;

      csvContent += `NET PROFIT/LOSS,${analytics.netProfit.toFixed(2)}\n`;
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Financial insights and export capabilities
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => exportToCSV('summary')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Summary
                </button>
                <button
                  onClick={() => exportToCSV('detailed')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Detailed
                </button>
                <button
                  onClick={() => exportToCSV('pl')}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  P&L Statement
                </button>
              </div>
            </div>

            {/* Period Filter */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Period:
              </label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {timePeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Total Revenue */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                          {formatCurrency(analytics.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                          {formatCurrency(analytics.totalExpenses)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit/Loss</p>
                        <p className={`text-2xl font-bold mt-2 ${
                          analytics.netProfit >= 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(analytics.netProfit)}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        analytics.netProfit >= 0
                          ? 'bg-indigo-100 dark:bg-indigo-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        <DollarSign className={`w-6 h-6 ${
                          analytics.netProfit >= 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row 1: Pie Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Revenue by Category */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Revenue by Category
                    </h3>
                    {revenuePieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={revenuePieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            paddingAngle={1}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={true}
                            style={{ fontSize: '11px' }}
                          >
                            {revenuePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No revenue data for this period
                      </div>
                    )}
                  </div>

                  {/* Expenses by Category */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Expenses by Category
                    </h3>
                    {expensePieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            paddingAngle={1}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={true}
                            style={{ fontSize: '11px' }}
                          >
                            {expensePieData.map((entry, index) => (
                              <Cell key={`expense-cell-${index}`} fill={EXPENSE_COLORS_SPREAD[index % EXPENSE_COLORS_SPREAD.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No expense data for this period
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart: Monthly Trend */}
                {analytics.monthlyTrend.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Revenue vs Expenses Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Category Breakdown Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Revenue Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(analytics.revenueByCategory).map(([category, amount]) => (
                            <tr key={category}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{category}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                {((amount / analytics.totalRevenue) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Total</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                              {formatCurrency(analytics.totalRevenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Expense Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(analytics.expensesByCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, amount]) => (
                              <tr key={category}>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{category}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                                  {formatCurrency(amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                  {((amount / analytics.totalExpenses) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Total</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                              {formatCurrency(analytics.totalExpenses)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default BookkeepingReports;
