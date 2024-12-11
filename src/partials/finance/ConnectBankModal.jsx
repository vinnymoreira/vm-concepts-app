// import React, { useEffect, useState, useCallback } from 'react';
// import { X } from 'lucide-react';
// import { usePlaidLink } from 'react-plaid-link';
// import { supabase } from '../../supabaseClient';

// const ConnectBankModal = ({ isOpen, onClose, onConnectBank }) => {
//   const [linkToken, setLinkToken] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch link token when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       getLinkToken();
//     }
//   }, [isOpen]);

//   // Get link token from your backend
//   const getLinkToken = async () => {
//     try {
//       setLoading(true);
//       // Replace with your backend API endpoint
//       const response = await fetch('/api/create-link-token');
//       const { link_token } = await response.json();
//       setLinkToken(link_token);
//     } catch (err) {
//       setError('Failed to initialize bank connection');
//       console.error('Error getting link token:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle successful connection
//   const onSuccess = useCallback(async (publicToken, metadata) => {
//     try {
//       setLoading(true);
      
//       // Exchange public token for access token (do this on your backend)
//       const response = await fetch('/api/exchange-public-token', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ public_token: publicToken })
//       });
      
//       const { access_token, item_id } = await response.json();
      
//       // Save connected bank info to your database
//       const { data, error: supabaseError } = await supabase
//         .from('connected_banks')
//         .insert([{
//           name: metadata.institution.name,
//           institution_id: metadata.institution.id,
//           item_id: item_id,
//           // Don't store access_token in the frontend/database for security
//           last_synced: new Date().toISOString()
//         }])
//         .select()
//         .single();

//       if (supabaseError) throw supabaseError;
      
//       onConnectBank(data);
//       onClose();
//     } catch (err) {
//       setError('Failed to save bank connection');
//       console.error('Error saving bank connection:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [onConnectBank, onClose]);

//   const { open, ready } = usePlaidLink({
//     token: linkToken,
//     onSuccess,
//     onExit: () => {
//       // Handle user exiting the Plaid flow
//       setError(null);
//     },
//     onEvent: (eventName, metadata) => {
//       // Optional: log events for analytics
//       console.log('Plaid event:', eventName, metadata);
//     },
//   });

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
//         <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
//           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
//             Connect Your Bank
//           </h2>
//           <button 
//             onClick={onClose}
//             className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4">
//           {error && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//               {error}
//             </div>
//           )}

//           <button
//             onClick={() => ready && open()}
//             disabled={!ready || loading}
//             className="w-full btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-gray-400"
//           >
//             {loading ? 'Connecting...' : 'Connect with Plaid'}
//           </button>

//           <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
//             Securely connect your bank account using Plaid's trusted service.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ConnectBankModal;