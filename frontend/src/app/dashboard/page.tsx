'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [wallet, setWallet] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    Promise.all([
      api.get('/wallet'),
      api.get('/users/portfolio'),
      api.get('/orders'),
    ]).then(([walletRes, portfolioRes, ordersRes]) => {
      setWallet(walletRes.data);
      setPortfolio(portfolioRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    });
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Wallet Balance</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${wallet?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${portfolio?.summary?.total_current_value?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
            <p
              className={`text-3xl font-bold mt-2 ${
                portfolio?.summary?.total_unrealized_pnl >= 0
                  ? 'text-success'
                  : 'text-danger'
              }`}
            >
              ${portfolio?.summary?.total_unrealized_pnl?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-3 font-semibold">{order.stock?.symbol}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            order.side === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">{order.quantity}</td>
                      <td className="py-3 text-right">${order.price?.toFixed(2)}</td>
                      <td className="py-3">
                        <span className="text-xs text-gray-600">{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent orders</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
