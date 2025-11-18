'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function PortfolioPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    api.get('/users/portfolio').then((res) => setPortfolio(res.data));
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !portfolio) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${portfolio.summary?.total_invested?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Current Value</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${portfolio.summary?.total_current_value?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Unrealized P&L</h3>
            <p
              className={`text-3xl font-bold mt-2 ${
                portfolio.summary?.total_unrealized_pnl >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              ${portfolio.summary?.total_unrealized_pnl?.toFixed(2) || '0.00'}
              <span className="text-lg ml-2">
                ({portfolio.summary?.total_unrealized_pnl_percent}%)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">Holdings</h2>
          </div>
          {portfolio.holdings && portfolio.holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Avg Buy Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      P&L %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {portfolio.holdings.map((holding: any) => (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {holding.stock_symbol}
                          </div>
                          <div className="text-sm text-gray-500">{holding.stock_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {holding.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        ${holding.average_buy_price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        ${holding.current_value?.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          holding.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        ${holding.unrealized_pnl?.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          holding.unrealized_pnl_percent >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {holding.unrealized_pnl_percent >= 0 ? '+' : ''}
                        {holding.unrealized_pnl_percent?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No holdings yet. Start trading to build your portfolio!
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
