// src/app/customers/new/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function CustomerNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // フォームの状態
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
    skinType: '',
    allergyInfo: '',
  });

  // フォーム入力の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saving) return;
    
    // バリデーション
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('名前と電話番号は必須項目です');
      return;
    }
    
    setSaving(true);

    try {
      // 新規顧客データを作成
      const newCustomer = {
        name: formData.name.trim(),
        kana: formData.kana.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        birthday: formData.birthday || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        memo: formData.memo.trim() || undefined,
        preferences: {
          hairType: formData.hairType.trim() || undefined,
          skinType: formData.skinType.trim() || undefined,
          allergyInfo: formData.allergyInfo.trim() || undefined,
        }
      };
      
      // APIに顧客データを送信
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '顧客の登録に失敗しました');
      }

      const createdCustomer = await response.json();
      
      // 成功メッセージを表示
      alert('顧客が登録されました');
      
      // 顧客詳細ページに移動
      router.push(`/customers/${createdCustomer.id}`);
      
    } catch (err) {
      console.error('顧客登録エラー:', err);
      alert(err instanceof Error ? err.message : '顧客の登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/customers');
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="text-blue-600 hover:text-blue-800"
                disabled={saving}
              >
                ← 顧客一覧に戻る
              </button>
            </div>
            <h1 className="text-2xl font-bold">新規顧客登録</h1>
          </div>

          {/* 登録フォーム */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50 border-b">
              <h2 className="text-xl font-semibold">顧客情報を入力</h2>
              {saving && (
                <div className="mt-2 text-sm text-blue-600">
                  登録中...
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* 基本情報 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">👤 基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <div className="mt-6">
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

              {/* 美容関連情報 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">💇‍♀️ 美容関連情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option value="太い髪">太い髪</option>
                      <option value="普通">普通</option>
                      <option value="くせ毛">くせ毛</option>
                      <option value="薄毛">薄毛</option>
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
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    アレルギー・注意事項
                  </label>
                  <textarea
                    name="allergyInfo"
                    value={formData.allergyInfo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="アレルギー情報や注意事項があれば記入してください"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* メモ */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">📝 メモ</h3>
                <textarea
                  name="memo"
                  value={formData.memo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="顧客に関するメモや特記事項があれば記入してください"
                  disabled={saving}
                />
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-3 border-t pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
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
                  {saving ? '登録中...' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}