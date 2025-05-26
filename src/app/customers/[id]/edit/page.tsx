// src/app/customers/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームデータの状態
  const [formData, setFormData] = useState({
    name: '',
    kana: '',
    phone: '',
    email: '',
    birthday: '',
    gender: '',
    address: '',
    memo: '',
    hairType: '',
    allergyInfo: '',
    skinType: ''
  });

  // 顧客データを取得
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/customers/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('顧客が見つかりませんでした');
          } else {
            throw new Error('顧客データの取得に失敗しました');
          }
          return;
        }
        
        const data = await response.json();
        setCustomer(data);
        
        // フォームデータを初期化
        setFormData({
          name: data.name || '',
          kana: data.kana || '',
          phone: data.phone || '',
          email: data.email || '',
          birthday: data.birthday || '',
          gender: data.gender || '',
          address: data.address || '',
          memo: data.memo || '',
          hairType: data.preferences?.hairType || '',
          allergyInfo: data.preferences?.allergyInfo || '',
          skinType: data.preferences?.skinType || ''
        });
        
      } catch (err) {
        console.error('顧客データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '顧客データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  // フォーム入力の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || saving) return;
    
    setSaving(true);

    try {
      // 更新データを作成
      const updateData = {
        name: formData.name.trim(),
        kana: formData.kana.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        birthday: formData.birthday || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim(),
        memo: formData.memo.trim(),
        preferences: {
          ...customer.preferences,
          hairType: formData.hairType.trim() || undefined,
          allergyInfo: formData.allergyInfo.trim() || 'なし',
          skinType: formData.skinType.trim() || undefined
        }
      };
      
      // APIに更新データを送信
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '顧客情報の更新に失敗しました');
      }

      // 成功メッセージを表示
      alert('顧客情報を更新しました');
      
      // 詳細ページに戻る
      router.push(`/customers/${customer.id}`);
      
    } catch (err) {
      console.error('顧客更新エラー:', err);
      alert(err instanceof Error ? err.message : '顧客情報の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-3xl mx-auto">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/customers/${params.id}`)}
                className="text-blue-600 hover:text-blue-800"
                disabled={saving}
              >
                ← 顧客詳細に戻る
              </button>
            </div>
            <h1 className="text-2xl font-bold">顧客情報を編集</h1>
          </div>

          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p>{error}</p>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => router.push(`/customers/${params.id}`)}
                  className="text-sm underline"
                >
                  顧客詳細に戻る
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-sm underline"
                >
                  再読み込み
                </button>
              </div>
            </div>
          )}

          {/* 編集フォーム */}
          {!loading && !error && customer && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-blue-50 border-b">
                <h2 className="text-xl font-semibold">顧客情報を編集</h2>
                {saving && (
                  <div className="mt-2 text-sm text-blue-600">
                    保存中...
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* 基本情報 */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">👤 基本情報</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ふりがな
                      </label>
                      <input
                        type="text"
                        name="kana"
                        value={formData.kana}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        電話番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        生年月日
                      </label>
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        性別
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="">選択してください</option>
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      住所
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* 髪質・肌質情報 */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">💡 髪質・肌質情報</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        髪質
                      </label>
                      <select
                        name="hairType"
                        value={formData.hairType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="">選択してください</option>
                        <option value="細い髪">細い髪</option>
                        <option value="普通">普通</option>
                        <option value="太い髪">太い髪</option>
                        <option value="くせ毛">くせ毛</option>
                        <option value="薄毛">薄毛</option>
                        <option value="硬い髪">硬い髪</option>
                        <option value="柔らかい髪">柔らかい髪</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        肌質
                      </label>
                      <select
                        name="skinType"
                        value={formData.skinType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="">選択してください</option>
                        <option value="普通">普通</option>
                        <option value="敏感肌">敏感肌</option>
                        <option value="乾燥肌">乾燥肌</option>
                        <option value="脂性肌">脂性肌</option>
                        <option value="混合肌">混合肌</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アレルギー情報
                    </label>
                    <input
                      type="text"
                      name="allergyInfo"
                      value={formData.allergyInfo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 化学薬品に軽度のアレルギー、なし"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* メモ */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📝 メモ</h3>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="顧客に関する特記事項やメモを入力してください"
                    disabled={saving}
                  ></textarea>
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end space-x-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/customers/${params.id}`)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    disabled={saving}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-md ${
                      saving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}