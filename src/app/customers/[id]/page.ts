// src/app/customers/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO, differenceInYears, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import Navigation from '@/components/Navigation';
import AppointmentStatusBadge from '@/components/AppointmentStatusBadge';

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
  appointments?: Appointment[];
};

// 予約データの型定義
type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  clientId: string;
  clientName: string;
  phone: string;
  services: Service[];
  totalPrice: number;
  totalDuration: number;
  note: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'preferences'>('info');

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
      default: return '未設定';
    }
  };

  // 最終来店からの日数計算
  const getDaysSinceLastVisit = (lastVisit?: string) => {
    if (!lastVisit) return null;
    try {
      return differenceInDays(new Date(), parseISO(lastVisit));
    } catch {
      return null;
    }
  };

  // 予約詳細ページへ移動
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  // 新規予約ページへ移動（顧客指定）
  const handleNewAppointment = () => {
    router.push(`/appointments/new?customerId=${params.id}`);
  };

  // 編集ページへ移動
  const handleEditCustomer = () => {
    router.push(`/customers/${params.id}/edit`);
  };

  // 統計情報の計算
  const getStatistics = () => {
    if (!customer?.appointments) return null;

    const completedAppointments = customer.appointments.filter(a => a.status === 'completed');
    const scheduledAppointments = customer.appointments.filter(a => a.status === 'scheduled');
    const cancelledAppointments = customer.appointments.filter(a => a.status === 'cancelled');

    // 月別来店回数（過去12ヶ月）
    const monthlyVisits: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, 'yyyy-MM');
      monthlyVisits[key] = 0;
    }

    completedAppointments.forEach(appointment => {
      const appointmentDate = parseISO(appointment.start);
      const key = format(appointmentDate, 'yyyy-MM');
      if (monthlyVisits.hasOwnProperty(key)) {
        monthlyVisits[key]++;
      }
    });

    return {
      completed: completedAppointments.length,
      scheduled: scheduledAppointments.length,
      cancelled: cancelledAppointments.length,
      monthlyVisits
    };
  };

  const statistics = getStatistics();

  // タブコンテンツの表示
  const renderTabContent = () => {
    if (!customer) return null;

    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">👤 基本情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">お名前</label>
                    <div className="text-lg font-medium">{customer.name}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">ふりがな</label>
                    <div className="text-gray-700">{customer.kana || '未設定'}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">電話番号</label>
                    <div className="text-gray-700">{customer.phone}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">メールアドレス</label>
                    <div className="text-gray-700">{customer.email || '未設定'}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">生年月日</label>
                    <div className="text-gray-700">
                      {customer.birthday ? (
                        <>
                          {format(parseISO(customer.birthday), 'yyyy年M月d日', { locale: ja })}
                          {calculateAge(customer.birthday) && (
                            <span className="ml-2 text-blue-600">
                              ({calculateAge(customer.birthday)}歳)
                            </span>
                          )}
                        </>
                      ) : '未設定'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">性別</label>
                    <div className="text-gray-700">{getGenderDisplay(customer.gender)}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">住所</label>
                    <div className="text-gray-700">{customer.address || '未設定'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 来店統計 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">📊 来店統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{customer.totalVisits}</div>
                  <div className="text-sm text-gray-600">総来店回数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ¥{customer.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">累計金額</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    ¥{customer.averageSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">平均単価</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {customer.lastVisit ? (
                      <>
                        {getDaysSinceLastVisit(customer.lastVisit)}
                        <span className="text-sm">日前</span>
                      </>
                    ) : (
                      '未来店'
                    )}
                  </div>
                  <div className="text-sm text-gray-600">最終来店</div>
                </div>
              </div>
            </div>

            {/* メモ */}
            {customer.memo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">📝 メモ</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-wrap">{customer.memo}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-4">
            {customer.appointments && customer.appointments.length > 0 ? (
              customer.appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAppointmentClick(appointment.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {appointment.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(appointment.start), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
                        〜{format(parseISO(appointment.end), 'HH:mm')}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="text-sm">
                      <div className="text-gray-500">💰 料金</div>
                      <div className="font-medium">{appointment.totalPrice.toLocaleString()}円</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-500">⏱️ 所要時間</div>
                      <div className="font-medium">{appointment.totalDuration}分</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-gray-500 mb-1">📋 施術内容</div>
                    <div className="flex flex-wrap gap-1">
                      {appointment.services.map((service) => (
                        <span 
                          key={service.id}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {appointment.note && (
                    <div className="mt-3 text-sm">
                      <div className="text-gray-500">📝 備考</div>
                      <div className="text-gray-700 text-xs">
                        {appointment.note}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4 text-6xl">📅</div>
                <p className="text-gray-500 mb-4">予約履歴がありません</p>
                <button
                  onClick={handleNewAppointment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  新規予約を作成
                </button>
              </div>
            )}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* 美容関連情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">💇‍♀️ 美容関連情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">髪質</label>
                    <div className="text-gray-700">
                      {customer.preferences?.hairType || '未設定'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">肌質</label>
                    <div className="text-gray-700">
                      {customer.preferences?.skinType || '未設定'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">よく利用するサービス</label>
                    <div>
                      {customer.preferences?.favoriteServices && customer.preferences.favoriteServices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.preferences.favoriteServices.map((service, index) => (
                            <span 
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">未設定</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* アレルギー情報 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">⚠️ アレルギー・注意事項</h3>
              <div className={`p-4 rounded-md ${
                customer.preferences?.allergyInfo && customer.preferences.allergyInfo !== 'なし'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50'
              }`}>
                <div className={`${
                  customer.preferences?.allergyInfo && customer.preferences.allergyInfo !== 'なし'
                    ? 'text-red-700 font-medium'
                    : 'text-gray-700'
                }`}>
                  {customer.preferences?.allergyInfo || '未設定'}
                </div>
              </div>
            </div>

            {/* 統計情報 */}
            {statistics && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">📈 予約統計</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{statistics.completed}</div>
                    <div className="text-sm text-gray-600">完了</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{statistics.scheduled}</div>
                    <div className="text-sm text-gray-600">予約中</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{statistics.cancelled}</div>
                    <div className="text-sm text-gray-600">キャンセル</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">顧客データを読み込み中...</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p>{error}</p>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => router.push('/customers')}
                  className="text-sm underline"
                >
                  顧客一覧に戻る
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

          {/* 顧客詳細 */}
          {!loading && !error && customer && (
            <div>
              {/* ヘッダー */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/customers')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← 顧客一覧に戻る
                  </button>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleNewAppointment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                  >
                    予約作成
                  </button>
                  <button
                    onClick={handleEditCustomer}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                  >
                    編集
                  </button>
                </div>
              </div>

              {/* 顧客名ヘッダー */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {customer.name}
                    </h1>
                    <p className="text-gray-600 text-lg">{customer.kana}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span>📞 {customer.phone}</span>
                      {customer.email && <span>✉️ {customer.email}</span>}
                      {customer.lastVisit && (
                        <span>
                          📅 最終来店: {format(parseISO(customer.lastVisit), 'yyyy/MM/dd', { locale: ja })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">顧客ID</div>
                    <div className="font-mono text-gray-700">#{customer.id}</div>
                  </div>
                </div>
              </div>

              {/* タブナビゲーション */}
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    {[
                      { key: 'info', label: '基本情報', icon: '👤' },
                      { key: 'appointments', label: '予約履歴', icon: '📅' },
                      { key: 'preferences', label: '設定・統計', icon: '⚙️' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                        {tab.key === 'appointments' && customer.appointments && (
                          <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {customer.appointments.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* タブコンテンツ */}
              {renderTabContent()}
            </div>
          )}
        </div>
      </main>
    </>
  );
}