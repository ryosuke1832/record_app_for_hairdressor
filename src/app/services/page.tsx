// src/app/services/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

// サービスデータの型定義
type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    category: '',
    description: ''
  });

  // カテゴリ一覧
  const categories = [
    '基本メニュー',
    'カラーメニュー',
    'パーマメニュー',
    'ケアメニュー',
    'スタイリング',
    'その他'
  ];

  // サービスデータを取得
  useEffect(() => {
    fetchServices();
  }, [categoryFilter, showInactive]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter,
        isActive: showInactive ? 'all' : 'true'
      });
      
      const response = await fetch(`/api/services?${params}`);
      if (!response.ok) {
        throw new Error('サービスデータの取得に失敗しました');
      }
      
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error('サービスデータ取得エラー:', err);
      setError(err instanceof Error ? err.message : 'サービスデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索実行
  const handleSearch = () => {
    fetchServices();
  };

  // 検索クリア
  const handleClearSearch = () => {
    setSearchQuery('');
    setTimeout(() => fetchServices(), 100);
  };

  // フォームデータ変更
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 新規サービス作成
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          duration: parseInt(formData.duration),
          price: parseInt(formData.price),
          category: formData.category,
          description: formData.description
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'サービスの作成に失敗しました');
      }

      alert('サービスを作成しました');
      setShowNewServiceForm(false);
      setFormData({ name: '', duration: '', price: '', category: '', description: '' });
      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'サービスの作成に失敗しました');
    }
  };

  // サービス編集
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      category: service.category,
      description: service.description || ''
    });
  };

  // サービス更新
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingService) return;
    
    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          duration: parseInt(formData.duration),
          price: parseInt(formData.price),
          category: formData.category,
          description: formData.description
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'サービスの更新に失敗しました');
      }

      alert('サービスを更新しました');
      setEditingService(null);
      setFormData({ name: '', duration: '', price: '', category: '', description: '' });
      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'サービスの更新に失敗しました');
    }
  };

  // サービス削除
  const handleDeleteService = async (service: Service) => {
    if (!confirm(`「${service.name}」を削除しますか？\n削除したサービスは非アクティブ状態となり、新規予約では選択できなくなります。`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'サービスの削除に失敗しました');
      }

      alert('サービスを削除しました');
      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'サービスの削除に失敗しました');
    }
  };

  // サービス復活
  const handleRestoreService = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          isActive: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'サービスの復活に失敗しました');
      }

      alert('サービスを復活しました');
      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'サービスの復活に失敗しました');
    }
  };

  // フォームキャンセル
  const handleCancelForm = () => {
    setShowNewServiceForm(false);
    setEditingService(null);
    setFormData({ name: '', duration: '', price: '', category: '', description: '' });
  };

  // サービスカードコンポーネント
  const ServiceCard = ({ service }: { service: Service }) => (
    <div className={`rounded-lg shadow-sm border p-4 ${
      service.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            {!service.isActive && (
              <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                削除済み
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{service.category}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {service.price.toLocaleString()}円
          </div>
          <div className="text-sm text-gray-500">
            {service.duration}分
          </div>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
      )}

      <div className="flex justify-end gap-2">
        {service.isActive ? (
          <>
            <button
              onClick={() => handleEditService(service)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              編集
            </button>
            <button
              onClick={() => handleDeleteService(service)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              削除
            </button>
          </>
        ) : (
          <button
            onClick={() => handleRestoreService(service)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            復活
          </button>
        )}
      </div>
    </div>
  );

  // サービスフォームコンポーネント
  const ServiceForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-full overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">
          {isEdit ? 'サービスを編集' : '新規サービス作成'}
        </h3>
        
        <form onSubmit={isEdit ? handleUpdateService : handleCreateService}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              サービス名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所要時間（分） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleFormChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                料金（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">カテゴリを選択</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="サービスの詳細説明"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEdit ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">メニュー管理</h1>
            <button
              onClick={() => setShowNewServiceForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
            >
              新規メニュー作成
            </button>
          </div>

          {/* 検索・フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="サービス名、カテゴリ、説明で検索"
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

              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">すべて</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">削除済みも表示</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* サービス数表示 */}
          {!loading && (
            <div className="mb-4">
              <p className="text-gray-600">
                {searchQuery || categoryFilter !== 'all' || showInactive 
                  ? `検索結果: ${services.length}件` 
                  : `全メニュー: ${services.length}件`}
              </p>
            </div>
          )}

          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">メニューデータを読み込み中...</p>
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

          {/* サービス一覧 */}
          {!loading && !error && (
            <div>
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4 text-6xl">📋</div>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || categoryFilter !== 'all' || showInactive 
                      ? '検索条件に該当するメニューが見つかりませんでした' 
                      : '登録されているメニューがありません'}
                  </p>
                  <button
                    onClick={() => setShowNewServiceForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    新規メニューを作成
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* サービス作成・編集フォーム */}
      {(showNewServiceForm || editingService) && (
        <ServiceForm isEdit={!!editingService} />
      )}
    </>
  );
}