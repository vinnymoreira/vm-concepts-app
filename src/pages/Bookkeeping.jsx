import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Upload, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import TransactionTable from '../partials/bookkeeping/TransactionTable';
import UploadStatementModal from '../partials/bookkeeping/UploadStatementModal';
import TransactionDetailPanel from '../partials/bookkeeping/TransactionDetailPanel';
import ExpandableSearchBar from '../components/ExpandableSearchBar';

function Bookkeeping() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('this_quarter');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { user, initialized} = useAuth();

  // Fetch data function (used on mount and after imports)
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

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      console.log('Loaded categories:', categoriesData?.length || 0);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('bookkeeping_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      setCategories(categoriesData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error('Error fetching bookkeeping data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, initialized]);

  // CRUD Operations
  const handleAddTransaction = async (transactionData, batchMode = false) => {
    if (!user) return;

    try {
      if (!batchMode) setLoading(true);

      const { data, error } = await supabase
        .from('bookkeeping_transactions')
        .insert([{ ...transactionData, user_id: user.id, source: 'manual' }])
        .select();

      if (error) throw error;

      if (data) {
        setTransactions(prev => [data[0], ...prev]);

        if (!batchMode) {
          setIsDetailPanelOpen(false);
          setSelectedTransaction(null);
        }
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.message);
    } finally {
      if (!batchMode) setLoading(false);
    }
  };

  const handleUpdateTransaction = async (transactionData) => {
    if (!user || !selectedTransaction) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookkeeping_transactions')
        .update(transactionData)
        .eq('id', selectedTransaction.id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setTransactions(prev =>
          prev.map(t => (t.id === data[0].id ? data[0] : t))
        );
        setSelectedTransaction(null);
        setIsDetailPanelOpen(false);
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookkeeping_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.message);
    }
  };

  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailPanelOpen(true);
  };

  const handleAddClick = () => {
    setSelectedTransaction(null); // null means add mode
    setIsDetailPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedTransaction(null);
  };

  const handleSaveTransaction = async (transactionData, batchMode = false) => {
    if (selectedTransaction) {
      // Edit mode
      await handleUpdateTransaction(transactionData);
    } else {
      // Add mode
      await handleAddTransaction(transactionData, batchMode);
    }
  };

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
      case 'q1':
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1
        endDate = new Date(now.getFullYear(), 2, 31); // Mar 31
        break;
      case 'q2':
        startDate = new Date(now.getFullYear(), 3, 1); // Apr 1
        endDate = new Date(now.getFullYear(), 5, 30); // Jun 30
        break;
      case 'q3':
        startDate = new Date(now.getFullYear(), 6, 1); // Jul 1
        endDate = new Date(now.getFullYear(), 8, 30); // Sep 30
        break;
      case 'q4':
        startDate = new Date(now.getFullYear(), 9, 1); // Oct 1
        endDate = new Date(now.getFullYear(), 11, 31); // Dec 31
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

  // Filter transactions by date range, search, type, and category
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return transactions.filter(t => {
      const transDate = t.transaction_date;

      // Date filter
      if (transDate < startDate || transDate > endDate) return false;

      // Search filter (merchant or description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const merchantMatch = t.merchant?.toLowerCase().includes(query);
        const descriptionMatch = t.description?.toLowerCase().includes(query);
        if (!merchantMatch && !descriptionMatch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [transactions, timePeriod, customStartDate, customEndDate, searchQuery, typeFilter, categoryFilter]);

  // Calculate P&L
  const plSummary = useMemo(() => {
    const revenue = filteredTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const netProfit = revenue - expenses;

    // Breakdown by category
    const revenueByCategory = {};
    const expensesByCategory = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'revenue') {
        revenueByCategory[t.category] = (revenueByCategory[t.category] || 0) + parseFloat(t.amount);
      } else {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
      }
    });

    return { revenue, expenses, netProfit, revenueByCategory, expensesByCategory };
  }, [filteredTransactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const currentYear = new Date().getFullYear();
    switch (timePeriod) {
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'this_quarter': return 'This Quarter';
      case 'this_year': return 'This Year';
      case 'q1': return `Q1 ${currentYear}`;
      case 'q2': return `Q2 ${currentYear}`;
      case 'q3': return `Q3 ${currentYear}`;
      case 'q4': return `Q4 ${currentYear}`;
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  if (!initialized) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to view your bookkeeping.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">

            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Bookkeeping
                </h1>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Upload Statement</span>
                </button>
                <button
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                  onClick={handleAddClick}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Period:
                </label>
                <select
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                >
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="this_year">This Year</option>
                  <option value="q1">Q1 (Jan-Mar)</option>
                  <option value="q2">Q2 (Apr-Jun)</option>
                  <option value="q3">Q3 (Jul-Sep)</option>
                  <option value="q4">Q4 (Oct-Dec)</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>

                {timePeriod === 'custom' && (
                  <>
                    <input
                      type="date"
                      className="form-input text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      placeholder="Start Date"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      className="form-input text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      placeholder="End Date"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards - P&L Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </h3>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(plSummary.revenue)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>

              {/* Total Expenses */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Expenses
                  </h3>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(plSummary.expenses)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>

              {/* Net Profit/Loss */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Net Profit/Loss
                  </h3>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    plSummary.netProfit >= 0
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      plSummary.netProfit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  plSummary.netProfit >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatCurrency(plSummary.netProfit)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>
            </div>

            {/* Setup Warning */}
            {categories.length === 0 && !loading && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Database Setup Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  No categories found. Please complete the database setup:
                </p>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
                  <li>Go to Supabase → SQL Editor</li>
                  <li>Run the migration script from <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">/supabase-migrations/bookkeeping-schema.sql</code></li>
                  <li>Run: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">SELECT seed_bookkeeping_categories(auth.uid());</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Transactions
                </h2>

                {/* Search and Filters */}
                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <ExpandableSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search transactions..."
                  />

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {categories
                      .filter(cat => typeFilter === 'all' || cat.type === typeFilter)
                      .map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                  </select>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <TransactionTable
                  transactions={filteredTransactions}
                  onRowClick={handleRowClick}
                  onDelete={handleDeleteTransaction}
                />
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportComplete={() => {
          fetchData(); // Refresh transactions after import
          setIsUploadModalOpen(false);
        }}
        categories={categories}
      />

      {/* Transaction Detail Panel (handles both add and edit) */}
      <TransactionDetailPanel
        isOpen={isDetailPanelOpen}
        onClose={handleClosePanel}
        transaction={selectedTransaction}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
      />
    </div>
  );
}

export default Bookkeeping;
