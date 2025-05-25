// src/app/customers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

// 顧客データの型定義
type Customer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  totalVisits: number;
  lastVisit?: string;
  totalSpent: number;
  averageSpent: number;
  preferences?: {
    hairType?: string;
    favoriteServices?: string[];
    allergyInfo?: string;
    skinType?: string;
  };
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 顧客データを取得
  useEffect(() => {
    fetchCustomers();
  }, [sortBy, sortOrder]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        search: searchQuery,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error('顧客データの取得に失敗しました');
      }
      
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('顧客データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '顧客データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索実行
  const handleSearch = () => {
    fetchCustomers();
  };

  // 検索クリア
  const handleClearSearch = () => {
    setSearchQuery('');
    setTimeout(() => fetchCustomers(), 100);
  };

  // ソート変更
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // 顧客詳細ページへ移動
  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  // 新規顧客登録ページへ移動
  const handleNewCustomer = () => {
    router.push('/customers/new');
  };

  // 年齢計算
  const calculateAge = (birthday?: string) => {
    if (!birthday) return null;
    try {
      return differenceInYears(new Date(), parseISO(birthday));
    } catch {
      return null;
    }
  };

  // 性別の表示
  const getGenderDisplay = (gender?: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '-';
    }
  };

  // 最終来店日の表示
  const getLastVisitDisplay = (lastVisit?: string) => {
    if (!lastVisit) return '未来店';
    try {
      return format(parseISO(lastVisit), 'yyyy/MM/dd', { locale: ja });
    } catch {
      return '不明';
    }
  };

  // ソートアイコン
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // 顧客カードコンポーネント
  const CustomerCard = ({ customer }: { customer: Customer }) => {
    const age = calculateAge(customer.birthday);
    const lastVisit = getLastVisitDisplay(customer.lastVisit);
    const hasRecentVisit = customer.lastVisit && 
      (new Date().getTime() - new Date(customer.lastVisit).getTime()) < (30 * 24 * 60 * 60 * 1000); // 30日以内

    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCustomerClick(customer.id)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-500">{customer.kana}</p>
          </div>
          <div className="text-right">
            {hasRecentVisit && (
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mb-1">
                最近来店
              </span>
            )}
            <div className="text-sm text-gray-600">
              来店 {customer.totalVisits}回
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="text-sm">
            <div className="text-gray-500">📞 電話番号</div>
            <div className="font-medium">{customer.phone}</div>
          </div>
          
          <div className="text-sm">
            <div className="text-gray-500">👤 性別・年齢</div>
            <div className="font-medium">
              {getGenderDisplay(customer.gender)}
              {age && ` (${age}歳)`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="text-sm">
            <div className="text-gray-500">📅 最終来店</div>
            <div className="font-medium">{lastVisit}</div>
          </div>
          
          <div className="text-sm">
            <div className="text-gray-500">💰 累計金額</div>
            <div className="font-medium">{customer.totalSpent.toLocaleString()}円</div>
          </div>
        </div>

        {customer.preferences?.favoriteServices && customer.preferences.favoriteServices.length > 0 && (
          <div className="text-sm">
            <div className="text-gray-500 mb-1">🔖 よく利用するサービス</div>
            <div className="flex flex-wrap gap-1">
              {customer.preferences.favoriteServices.map((service, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {customer.memo && (
          <div className="mt-3 text-sm">
            <div className="text-gray-500">📝 メモ</div>
            <div className="text-gray-700 text-xs line-clamp-2">
              {customer.memo}
            </div>
          </div>
        )}

        {customer.preferences?.allergyInfo && customer.preferences.allergyInfo !== 'なし' && (
          <div className="mt-2">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
              ⚠️ アレルギー情報有り
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">顧客管理</h1>
            <button
              onClick={handleNewCustomer}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
            >
              新規顧客登録
            </button>
          </div>

          {/* 検索・フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="顧客名、ふりがな、電話番号、メールアドレスで検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    検索
                  </button>
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ソートオプション */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 self-center">並び順:</span>
              {[
                { value: 'name', label: '名前' },
                { value: 'lastVisit', label: '最終来店日' },
                { value: 'totalVisits', label: '来店回数' },
                { value: 'totalSpent', label: '累計金額' },
                { value: 'createdAt', label: '登録日' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {option.label} {getSortIcon(option.value)}
                </button>
              ))}
            </div>
          </div>

          {/* 顧客数表示 */}
          {!loading && (
            <div className="mb-4">
              <p className="text-gray-600">
                {searchQuery ? `検索結果: ${customers.length}件` : `全顧客: ${customers.length}件`}
              </p>
            </div>
          )}

          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">顧客データを読み込み中...</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline"
              >
                再読み込み
              </button>
            </div>
          )}

          {/* 顧客一覧 */}
          {!loading && !error && (
            <div>
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4 text-6xl">👥</div>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? '検索条件に該当する顧客が見つかりませんでした' : '登録されている顧客がありません'}
                  </p>
                  <button
                    onClick={handleNewCustomer}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    新規顧客を登録
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(customer => (
                    <CustomerCard key={customer.id} customer={customer} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}