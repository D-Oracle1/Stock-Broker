'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [stock, setStock] = useState<any>(null);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    api.get(`/stocks/${params.symbol}`).then((res) => setStock(res.data));
  }, [isAuthenticated, params.symbol, router]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/orders', {
        stock_symbol: params.symbol,
        type: 'market',
        side: orderType,
        quantity,
      });
      setMessage(`${orderType.toUpperCase()} order placed successfully!`);
      setQuantity(1);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !stock) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
              <p className="text-gray-500">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${stock.current_price?.toFixed(2)}</p>
              <p
                className={`text-sm ${
                  stock.change_percent >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {stock.change_percent >= 0 ? '+' : ''}
                {stock.change_percent?.toFixed(2)}% (${stock.change_amount?.toFixed(2)})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-500">Open</p>
              <p className="font-semibold">${stock.opening_price?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">High</p>
              <p className="font-semibold">${stock.high_price?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Low</p>
              <p className="font-semibold">${stock.low_price?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Volume</p>
              <p className="font-semibold">{stock.volume?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Place Order</h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes('success')
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleOrder} className="space-y-4">
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  orderType === 'buy'
                    ? 'bg-success text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setOrderType('buy')}
              >
                Buy
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  orderType === 'sell'
                    ? 'bg-danger text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => setOrderType('sell')}
              >
                Sell
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price per share:</span>
                <span className="font-semibold">${stock.current_price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${(stock.current_price * quantity).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-md font-medium text-white ${
                orderType === 'buy'
                  ? 'bg-success hover:bg-green-600'
                  : 'bg-danger hover:bg-red-600'
              } disabled:opacity-50`}
            >
              {loading
                ? 'Processing...'
                : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} shares`}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
