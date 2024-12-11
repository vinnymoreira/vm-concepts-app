// import React, { useState, useEffect } from 'react';
// import { 
//   ArrowUpRight, 
//   ArrowDownRight,
//   Search,
//   Filter,
//   Calendar 
// } from 'lucide-react';
// import { supabase } from '../../supabaseClient';

// const TransactionsList = () => {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [dateRange, setDateRange] = useState('thisMonth');

//   useEffect(() => {
//     fetchTransactions();
//   }, [filterCategory, dateRange]);

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true);
      
//       // Build the query based on filters
//       let query = supabase
//         .from('transactions')
//         .select('*')
//         .order('date', { ascending: false });

//       // Apply date range filter
//       const today = new Date();
//       const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
//       const startOfYear = new Date(today.getFullYear(), 0, 1);

//       switch (dateRange) {
//         case 'thisMonth':
//           query = query.gte('date', startOfMonth.toISOString());
//           break;
//         case 'thisQuarter':
//           query = query.gte('date', startOfQuarter.toISOString());
//           break;
//         case 'thisYear':
//           query = query.gte('date', startOfYear.toISOString());
//           break;
//       }

//       // Apply category filter
//       if (filterCategory !== 'all') {
//         query = query.eq('category', filterCategory);
//       }

//       const { data, error } = await query;

//       if (error) throw error;
      
//       setTransactions(data || []);
//     } catch (err) {
//       console.error('Error fetching transactions:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredTransactions = transactions.filter(transaction =>
//     transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const formatAmount = (amount, type) => {
//     const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     });
//     return type === 'expense' ? `-${formattedAmount}` : formattedAmount;
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
//       {/* Header and Filters */}
//       <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//         <div className="sm:flex sm:justify-between sm:items-center">
//           <div className="mb-4 sm:mb-0">
//             <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
//               Transactions
//             </h2>
//           </div>
//           <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
//             {/* Search */}
//             <div className="relative">
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search transactions..."
//                 className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
//               />
//               <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//             </div>

//             {/* Category Filter */}
//             <select
//               value={filterCategory}
//               onChange={(e) => setFilterCategory(e.target.value)}
//               className="pl-3 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
//             >
//               <option value="all">All Categories</option>
//               <option value="software">Software</option>
//               <option value="services">Services</option>
//               <option value="office">Office</option>
//               <option value="marketing">Marketing</option>
//             </select>

//             {/* Date Range Filter */}
//             <select
//               value={dateRange}
//               onChange={(e) => setDateRange(e.target.value)}
//               className="pl-3 pr-10 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
//             >
//               <option value="thisMonth">This Month</option>
//               <option value="thisQuarter">This Quarter</option>
//               <option value="thisYear">This Year</option>
//               <option value="allTime">All Time</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Transactions Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50">
//               <th className="px-4 py-3 whitespace-nowrap">
//                 <div className="font-semibold text-left">Date</div>
//               </th>
//               <th className="px-4 py-3 whitespace-nowrap">
//                 <div className="font-semibold text-left">Description</div>
//               </th>
//               <th className="px-4 py-3 whitespace-nowrap">
//                 <div className="font-semibold text-left">Category</div>
//               </th>
//               <th className="px-4 py-3 whitespace-nowrap">
//                 <div className="font-semibold text-right">Amount</div>
//               </th>
//             </tr>
//           </thead>
//           <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
//             {filteredTransactions.map((transaction) => (
//               <tr key={transaction.id}>
//                 <td className="px-4 py-3 whitespace-nowrap">
//                   <div className="text-left">{new Date(transaction.date).toLocaleDateString()}</div>
//                 </td>
//                 <td className="px-4 py-3">
//                   <div className="text-left font-medium text-gray-800 dark:text-gray-100">
//                     {transaction.description}
//                   </div>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap">
//                   <div className="text-left">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
//                       {transaction.category}
//                     </span>
//                   </div>
//                 </td>
//                 <td className="px-4 py-3 whitespace-nowrap">
//                   <div className={`text-right font-medium ${
//                     transaction.type === 'expense' 
//                       ? 'text-red-500' 
//                       : 'text-green-500'
//                   }`}>
//                     {formatAmount(transaction.amount, transaction.type)}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default TransactionsList;