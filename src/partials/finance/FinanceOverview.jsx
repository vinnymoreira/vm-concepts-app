// import React from 'react';
// import { ArrowUpRight, ArrowDownRight, TrendingUp, ArrowDown } from 'lucide-react';

// const StatCard = ({ title, amount, trend, isPositive }) => (
//   <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//     <div className="flex items-center justify-between">
//       <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
//       <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
//         {trend}%
//         {isPositive ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
//       </span>
//     </div>
//     <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
//       ${amount.toLocaleString()}
//     </p>
//   </div>
// );

// const FinanceOverview = ({ stats }) => {
//   const {
//     monthlyIncome,
//     monthlyExpenses,
//     yearlyIncome,
//     yearlyExpenses,
//     quarterlyIncome,
//     quarterlyExpenses
//   } = stats;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
//       <StatCard
//         title="Monthly Income"
//         amount={monthlyIncome}
//         trend={12}
//         isPositive={true}
//       />
//       <StatCard
//         title="Monthly Expenses"
//         amount={monthlyExpenses}
//         trend={8}
//         isPositive={false}
//       />
//       <StatCard
//         title="Monthly Net"
//         amount={monthlyIncome - monthlyExpenses}
//         trend={15}
//         isPositive={true}
//       />
//       <StatCard
//         title="Quarterly Income"
//         amount={quarterlyIncome}
//         trend={10}
//         isPositive={true}
//       />
//       <StatCard
//         title="Quarterly Expenses"
//         amount={quarterlyExpenses}
//         trend={5}
//         isPositive={false}
//       />
//       <StatCard
//         title="Quarterly Net"
//         amount={quarterlyIncome - quarterlyExpenses}
//         trend={18}
//         isPositive={true}
//       />
//     </div>
//   );
// };

// // Also export individual widgets that can be used in the dashboard
// export const MonthlyIncomeWidget = ({ amount }) => (
//   <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
//     <div className="px-5 pt-5 pb-5">
//       <div className="flex items-center">
//         <div className="mr-2">
//           <TrendingUp className="w-8 h-8 text-green-500" />
//         </div>
//         <div className="flex-1">
//           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Income</h3>
//           <div className="flex items-center">
//             <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">${amount.toLocaleString()}</div>
//             <div className="text-sm font-medium text-green-500">+12%</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// export const MonthlyExpensesWidget = ({ amount }) => (
//   <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
//     <div className="px-5 pt-5 pb-5">
//       <div className="flex items-center">
//         <div className="mr-2">
//           <ArrowDown className="w-8 h-8 text-red-500" />
//         </div>
//         <div className="flex-1">
//           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Expenses</h3>
//           <div className="flex items-center">
//             <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">${amount.toLocaleString()}</div>
//             <div className="text-sm font-medium text-red-500">+8%</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// export default FinanceOverview;