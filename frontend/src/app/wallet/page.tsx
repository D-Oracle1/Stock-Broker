'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function WalletPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadWalletData();
  }, [isAuthenticated, router]);

  const loadWalletData = () => {
    Promise.all([
      api.get('/wallet'),
      api.get('/wallet/transactions'),
    ]).then(([walletRes, txRes]) => {
      setWallet(walletRes.data);
      setTransactions(txRes.data.transactions);
    });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/wallet/deposit/create', {
        amount: parseFloat(depositAmount),
        payment_method: 'paystack',
      });
      alert(`Deposit initiated. Payment URL: ${response.data.payment_url}`);
      setShowDeposit(false);
      setDepositAmount('');
      loadWalletData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deposit failed');
    }
  };

  if (!isAuthenticated || !wallet) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              ${wallet.balance?.toFixed(2)}
            </p>
            <button
              onClick={() => setShowDeposit(!showDeposit)}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Deposit Funds
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Locked Balance</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              ${wallet.locked_balance?.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Funds reserved for pending orders</p>
          </div>
        </div>

        {showDeposit && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Deposit Funds</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                >
                  Continue to Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeposit(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Transaction History</h2>
          </div>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            tx.type === 'deposit' || tx.type === 'sell'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.description || tx.type}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          tx.type === 'deposit' || tx.type === 'sell'
                            ? 'text-success'
                            : 'text-danger'
                        }`}
                      >
                        {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}$
                        {tx.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        ${tx.balance_after?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">No transactions yet</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
