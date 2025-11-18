'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Home() {
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stocks').then(res => setStocks(res.data.slice(0, 5)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">StockBroker</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Trade Stocks with Confidence
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Access real-time market data, manage your portfolio, and execute trades seamlessly
          </p>
          <Link
            href="/register"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 inline-block"
          >
            Open Account
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.symbol} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-semibold">{stock.symbol}</td>
                    <td className="py-3">{stock.name}</td>
                    <td className="py-3 text-right">${stock.current_price}</td>
                    <td
                      className={`py-3 text-right ${
                        stock.change_percent >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {stock.change_percent >= 0 ? '+' : ''}
                      {stock.change_percent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">Real-Time Trading</h3>
            <p className="text-gray-600">
              Execute trades instantly with real-time market prices and updates
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">Secure Platform</h3>
            <p className="text-gray-600">
              Bank-level security with 2FA and encrypted transactions
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">Portfolio Management</h3>
            <p className="text-gray-600">
              Track your investments with detailed analytics and reports
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 StockBroker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
