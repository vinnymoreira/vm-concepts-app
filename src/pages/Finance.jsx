// import React, { useState, useEffect } from 'react';
// import { CircleDollarSign, Plus, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
// import { supabase } from '../supabaseClient';

// import Sidebar from '../partials/Sidebar';
// import Header from '../partials/Header';
// import ConnectBankModal from '../partials/finance/ConnectBankModal';
// import TransactionsList from '../partials/finance/TransactionsList';
// import FinanceOverview from '../partials/finance/FinanceOverview';

// function Finance() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [isConnectBankModalOpen, setIsConnectBankModalOpen] = useState(false);
//   const [connectedBanks, setConnectedBanks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [financialStats, setFinancialStats] = useState({
//     monthlyIncome: 0,
//     monthlyExpenses: 0,
//     yearlyIncome: 0,
//     yearlyExpenses: 0,
//     quarterlyIncome: 0,
//     quarterlyExpenses: 0
//   });

//   useEffect(() => {
//     fetchBanks();
//     fetchFinancialStats();
//   }, []);

//   const fetchBanks = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('connected_banks')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setConnectedBanks(data || []);
//     } catch (err) {
//       console.error('Error fetching banks:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFinancialStats = async () => {
//     try {
//       // Here you would implement the actual logic to fetch financial statistics
//       // For now, using placeholder data
//       const stats = {
//         monthlyIncome: 45000,
//         monthlyExpenses: 32000,
//         yearlyIncome: 540000,
//         yearlyExpenses: 384000,
//         quarterlyIncome: 135000,
//         quarterlyExpenses: 96000
//       };
//       setFinancialStats(stats);
//     } catch (err) {
//       console.error('Error fetching financial stats:', err);
//       setError(err.message);
//     }
//   };

//   const handleConnectBank = async (bankDetails) => {
//     try {
//       const { data, error } = await supabase
//         .from('connected_banks')
//         .insert([{
//           name: bankDetails.name,
//           type: bankDetails.type,
//           last_synced: new Date().toISOString()
//         }])
//         .select()
//         .single();

//       if (error) throw error;
      
//       setConnectedBanks([...connectedBanks, data]);
//       setIsConnectBankModalOpen(false);
//     } catch (err) {
//       console.error('Error connecting bank:', err);
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="flex h-screen overflow-hidden">
//       <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

//       <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
//         <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

//         <main className="grow">
//           {loading ? (
//             <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
//               <div className="flex items-center justify-center h-64">
//                 <div className="text-gray-600 dark:text-gray-400">
//                   Loading finance data...
//                 </div>
//               </div>
//             </div>
//           ) : error ? (
//             <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
//               <div className="flex items-center justify-center h-64">
//                 <div className="text-red-500">Error: {error}</div>
//               </div>
//             </div>
//           ) : (
//             <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
//               {/* Header section */}
//               <div className="sm:flex sm:justify-between sm:items-center mb-8">
//                 <div className="mb-4 sm:mb-0">
//                   <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Finance</h1>
//                 </div>
//                 <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
//                   <button
//                     onClick={() => setIsConnectBankModalOpen(true)}
//                     className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
//                   >
//                     <Plus className="w-4 h-4 mr-2" />
//                     <span>Connect Bank</span>
//                   </button>
//                 </div>
//               </div>

//               {/* Finance Overview */}
//               <FinanceOverview stats={financialStats} />

//               {/* Connected Banks */}
//               <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-8">
//                 <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Connected Banks</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {connectedBanks.map((bank) => (
//                     <div 
//                       key={bank.id}
//                       className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
//                     >
//                       <div className="flex items-center">
//                         <Building2 className="w-6 h-6 text-indigo-500 mr-3" />
//                         <div>
//                           <h3 className="font-medium text-gray-800 dark:text-gray-100">{bank.name}</h3>
//                           <p className="text-sm text-gray-500 dark:text-gray-400">
//                             Last synced: {new Date(bank.last_synced).toLocaleDateString()}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Transactions List */}
//               <TransactionsList />
//             </div>
//           )}
//         </main>
//       </div>

//       <ConnectBankModal 
//         isOpen={isConnectBankModalOpen}
//         onClose={() => setIsConnectBankModalOpen(false)}
//         onConnectBank={handleConnectBank}
//       />
//     </div>
//   );
// }

// export default Finance;