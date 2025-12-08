import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, DollarSign, TrendingDown, TrendingUp, Home, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AddRentalPropertyModal from '../partials/bookkeeping/AddRentalPropertyModal';
import AddRentalRecordModal from '../partials/bookkeeping/AddRentalRecordModal';
import RentalPropertyTable from '../partials/bookkeeping/RentalPropertyTable';

function Rentals() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rentalProperties, setRentalProperties] = useState([]);
  const [rentalRecords, setRentalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('this_quarter');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { user, initialized } = useAuth();

  // Fetch data
  const fetchData = async () => {
    if (!user || !initialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch rental properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('rental_properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch rental records
      const { data: recordsData, error: recordsError } = await supabase
        .from('rental_records')
        .select('*')
        .eq('user_id', user.id)
        .order('record_date', { ascending: false });

      if (recordsError) throw recordsError;

      setRentalProperties(propertiesData || []);
      setRentalRecords(recordsData || []);
    } catch (err) {
      console.error('Error fetching rental data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, initialized]);

  // Property CRUD Operations
  const handleAddProperty = async (propertyData) => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('rental_properties')
        .insert([{ ...propertyData, user_id: user.id }])
        .select();

      if (error) throw error;

      if (data) {
        setRentalProperties(prev => [data[0], ...prev]);
        setIsPropertyModalOpen(false);
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error('Error adding property:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (propertyData) => {
    if (!user || !selectedProperty) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('rental_properties')
        .update(propertyData)
        .eq('id', selectedProperty.id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setRentalProperties(prev =>
          prev.map(p => (p.id === data[0].id ? data[0] : p))
        );
        setIsPropertyModalOpen(false);
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProperty = async (propertyData) => {
    if (selectedProperty) {
      await handleUpdateProperty(propertyData);
    } else {
      await handleAddProperty(propertyData);
    }
  };

  // Record CRUD Operations
  const handleAddRecord = async (recordData) => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('rental_records')
        .insert([{ ...recordData, user_id: user.id }])
        .select();

      if (error) throw error;

      if (data) {
        setRentalRecords(prev => [data[0], ...prev]);
        setIsRecordModalOpen(false);
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (recordData) => {
    if (!user || !selectedRecord) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('rental_records')
        .update(recordData)
        .eq('id', selectedRecord.id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setRentalRecords(prev =>
          prev.map(r => (r.id === data[0].id ? data[0] : r))
        );
        setIsRecordModalOpen(false);
        setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Error updating record:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (recordData) => {
    if (selectedRecord) {
      await handleUpdateRecord(recordData);
    } else {
      await handleAddRecord(recordData);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('rental_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRentalRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err.message);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!user) return;

    const property = rentalProperties.find(p => p.id === propertyId);
    if (!property) return;

    if (window.confirm(`Are you sure you want to delete ${property.property_name}? This will also delete all associated monthly records.`)) {
      try {
        const { error } = await supabase
          .from('rental_properties')
          .delete()
          .eq('id', propertyId)
          .eq('user_id', user.id);

        if (error) throw error;

        setRentalProperties(prev => prev.filter(p => p.id !== propertyId));
        setRentalRecords(prev => prev.filter(r => r.property_id !== propertyId));
      } catch (err) {
        console.error('Error deleting property:', err);
        setError(err.message);
      }
    }
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setIsPropertyModalOpen(true);
  };

  const handleRecordRowClick = (record) => {
    setSelectedRecord(record);
    setIsRecordModalOpen(true);
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
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 2, 31);
        break;
      case 'q2':
        startDate = new Date(now.getFullYear(), 3, 1);
        endDate = new Date(now.getFullYear(), 5, 30);
        break;
      case 'q3':
        startDate = new Date(now.getFullYear(), 6, 1);
        endDate = new Date(now.getFullYear(), 8, 30);
        break;
      case 'q4':
        startDate = new Date(now.getFullYear(), 9, 1);
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

  // Filter rental records by date range
  const filteredRentalRecords = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return rentalRecords.filter(r => {
      const recordDate = r.record_date;
      return recordDate >= startDate && recordDate <= endDate;
    });
  }, [rentalRecords, timePeriod, customStartDate, customEndDate]);

  // Calculate Rental Property Summary
  const rentalSummary = useMemo(() => {
    const totalIncome = filteredRentalRecords.reduce((sum, r) => sum + parseFloat(r.rental_income || 0), 0);

    const totalExpenses = filteredRentalRecords.reduce((sum, r) => {
      return sum +
        parseFloat(r.mortgage || 0) +
        parseFloat(r.maintenance || 0) +
        parseFloat(r.property_management || 0) +
        parseFloat(r.other_expenses || 0);
    }, 0);

    const netProfit = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netProfit };
  }, [filteredRentalRecords]);

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
                  Please sign in to view your rental properties.
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
                  Rental Properties
                </h1>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                  onClick={() => {
                    setSelectedProperty(null);
                    setIsPropertyModalOpen(true);
                  }}
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span>Add Property</span>
                </button>
                <button
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                  onClick={() => {
                    setSelectedRecord(null);
                    setIsRecordModalOpen(true);
                  }}
                  disabled={rentalProperties.length === 0}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Monthly Record</span>
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
                  <option value="custom">Custom Range</option>
                </select>

                {timePeriod === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="End Date"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Rental Income */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Rental Income
                  </h3>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(rentalSummary.totalIncome)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>

              {/* Total Rental Expenses */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Rental Expenses
                  </h3>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(rentalSummary.totalExpenses)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>

              {/* Net Rental Profit/Loss */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Net Rental Profit/Loss
                  </h3>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    rentalSummary.netProfit >= 0
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      rentalSummary.netProfit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  rentalSummary.netProfit >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {formatCurrency(rentalSummary.netProfit)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getPeriodLabel()}
                </p>
              </div>
            </div>

            {/* Properties List */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Your Properties
              </h3>
              {rentalProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No properties yet.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Click "Add Property" to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rentalProperties.map((property) => (
                    <div
                      key={property.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {property.property_name}
                          </h4>
                          {property.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {property.description}
                            </p>
                          )}
                        </div>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rental Records Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Monthly Records
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <RentalPropertyTable
                  records={filteredRentalRecords}
                  properties={rentalProperties}
                  onRowClick={handleRecordRowClick}
                  onDelete={handleDeleteRecord}
                />
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Add/Edit Rental Property Modal */}
      <AddRentalPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setSelectedProperty(null);
        }}
        onSubmit={handleSaveProperty}
        editProperty={selectedProperty}
      />

      {/* Add/Edit Rental Record Modal */}
      <AddRentalRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleSaveRecord}
        properties={rentalProperties}
        editRecord={selectedRecord}
      />
    </div>
  );
}

export default Rentals;
