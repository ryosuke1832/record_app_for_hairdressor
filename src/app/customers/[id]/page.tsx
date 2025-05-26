// src/app/customers/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO, differenceInYears, isBefore, startOfDay } from 'date-fns';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      default: return '-';
    }
  };

  // 最終来店日の表示
  const getLastVisitDisplay = (lastVisit?: string) => {
    if (!lastVisit) return '未来店';
    try {
      return format(parseISO(lastVisit), 'yyyy年M月d日(E)', { locale: ja });
    } catch {
      return '不明';
    }
  };

  // 顧客削除
  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '顧客の削除に失敗しました');
      }

      alert('顧客を削除しました');
      router.push('/customers');
      
    } catch (err) {
      console.error('顧客削除エラー:', err);
      alert(err instanceof Error ? err.message : '顧客の削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 編集ページへ移動
  const handleEditCustomer = () => {
    router.push(`/customers/${params.id}/edit`);
  };

  // 新規予約作成（顧客情報を事前選択）
  const handleNewAppointment = () => {
    router.push(`/appointments/new?customerId=${params.id}&customerName=${encodeURIComponent(customer?.name || '')}`);
  };

  // 予約詳細ページへ移動
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  // 今日以降と過去の予約を分ける
  const today = startOfDay(new Date());
  const futureAppointments = customer?.appointments?.filter(
    appointment => !isBefore(parseISO(appointment.start), today)
  ) || [];
  const pastAppointments = customer?.appointments?.filter(
    appointment => isBefore(parseISO(appointment.start), today)
  ) || [];

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
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                  >
                    予約作成
                  </button>
                  <button
                    onClick={handleEditCustomer}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                    disabled={isDeleting}
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 顧客基本情報 */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">👤 基本情報</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">お名前</div>
                        <div className="text-lg font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.kana}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">電話番号</div>
                        <div className="font-medium">{customer.phone}</div>
                      </div>
                      
                      {customer.email && (
                        <div>
                          <div className="text-sm text-gray-500">メールアドレス</div>
                          <div className="font-medium">{customer.email}</div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm text-gray-500">性別・年齢</div>
                        <div className="font-medium">
                          {getGenderDisplay(customer.gender)}
                          {calculateAge(customer.birthday) && ` (${calculateAge(customer.birthday)}歳)`}
                        </div>
                        {customer.birthday && (
                          <div className="text-sm text-gray-500">
                            {format(parseISO(customer.birthday), 'yyyy年M月d日', { locale: ja })}
                          </div>
                        )}
                      </div>
                      
                      {customer.address && (
                        <div>
                          <div className="text-sm text-gray-500">住所</div>
                          <div className="font-medium">{customer.address}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 来店統計 */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">📊 来店統計</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{customer.totalVisits}</div>
                        <div className="text-sm text-gray-500">来店回数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {customer.totalSpent.toLocaleString()}円
                        </div>
                        <div className="text-sm text-gray-500">累計金額</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">平均単価:</span>
                        <span className="font-medium">{customer.averageSpent.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-500">最終来店:</span>
                        <span className="font-medium">{getLastVisitDisplay(customer.lastVisit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 顧客メモ・設定 */}
                  {(customer.memo || customer.preferences) && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">📝 メモ・設定</h3>
                      
                      {customer.memo && (
                        <div className="mb-4">
                          <div className="text-sm text-gray-500 mb-1">メモ</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{customer.memo}</div>
                        </div>
                      )}
                      
                      {customer.preferences && (
                        <div className="space-y-3">
                          {customer.preferences.hairType && (
                            <div>
                              <span className="text-sm text-gray-500">髪質: </span>
                              <span className="font-medium">{customer.preferences.hairType}</span>
                            </div>
                          )}
                          
                          {customer.preferences.skinType && (
                            <div>
                              <span className="text-sm text-gray-500">肌質: </span>
                              <span className="font-medium">{customer.preferences.skinType}</span>
                            </div>
                          )}
                          
                          {customer.preferences.allergyInfo && customer.preferences.allergyInfo !== 'なし' && (
                            <div>
                              <span className="text-sm text-gray-500">アレルギー: </span>
                              <span className="font-medium text-red-600">{customer.preferences.allergyInfo}</span>
                            </div>
                          )}
                          
                          {customer.preferences.favoriteServices && customer.preferences.favoriteServices.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-1">よく利用するサービス</div>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 予約履歴 */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">📅 予約履歴</h2>
                      <button
                        onClick={handleNewAppointment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        新規予約
                      </button>
                    </div>

                    {(!customer.appointments || customer.appointments.length === 0) ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2 text-4xl">📝</div>
                        <p className="text-gray-500 mb-4">予約履歴がありません</p>
                        <button
                          onClick={handleNewAppointment}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                          初回予約を作成
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* 今後の予約 */}
                        {futureAppointments.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3">
                              今後の予約 ({futureAppointments.length}件)
                            </h3>
                            <div className="space-y-3">
                              {futureAppointments.map(appointment => (
                                <AppointmentCard 
                                  key={appointment.id} 
                                  appointment={appointment} 
                                  onClick={() => handleAppointmentClick(appointment.id)}
                                  isPast={false}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 過去の予約 */}
                        {pastAppointments.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-600 mb-3">
                              過去の予約 ({pastAppointments.length}件)
                            </h3>
                            <div className="space-y-3">
                              {pastAppointments.slice(0, 10).map(appointment => (
                                <AppointmentCard 
                                  key={appointment.id} 
                                  appointment={appointment} 
                                  onClick={() => handleAppointmentClick(appointment.id)}
                                  isPast={true}
                                />
                              ))}
                              {pastAppointments.length > 10 && (
                                <div className="text-center py-2">
                                  <p className="text-sm text-gray-500">
                                    他 {pastAppointments.length - 10} 件の予約履歴があります
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && customer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-red-600">⚠️ 顧客削除の確認</h3>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                <strong>{customer.name}</strong> さんを削除しますか？
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">
                  <strong>注意:</strong> この操作は取り消せません。顧客の情報と関連する予約履歴がすべて削除されます。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteCustomer}
                className={`px-4 py-2 text-white rounded-md ${
                  isDeleting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 予約カードコンポーネント
const AppointmentCard = ({ 
  appointment, 
  onClick, 
  isPast = false 
}: { 
  appointment: Appointment, 
  onClick: () => void,
  isPast?: boolean 
}) => {
  const appointmentDate = parseISO(appointment.start);
  const appointmentEnd = parseISO(appointment.end);
  
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isPast 
          ? 'bg-gray-50 border-gray-200 opacity-75' 
          : 'bg-white border-gray-300 hover:border-blue-300'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className={`font-medium ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
            {appointment.title}
          </h4>
          <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            {format(appointmentDate, 'yyyy年M月d日(E) HH:mm', { locale: ja })} 
            - {format(appointmentEnd, 'HH:mm')}
          </div>
        </div>
        <AppointmentStatusBadge 
          status={appointment.status} 
          className={isPast ? 'opacity-75' : ''}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
          <div className="flex flex-wrap gap-1">
            {appointment.services.map((service, index) => (
              <span 
                key={service.id}
                className={`px-2 py-1 rounded text-xs ${
                  isPast 
                    ? 'bg-gray-200 text-gray-600' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {service.name}
              </span>
            ))}
          </div>
        </div>
        <div className={`text-sm font-medium ${isPast ? 'text-gray-500' : 'text-gray-700'}`}>
          {appointment.totalPrice.toLocaleString()}円
        </div>
      </div>
      
      {appointment.note && (
        <div className={`mt-2 text-xs ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="truncate">{appointment.note}</div>
        </div>
      )}
    </div>
  );
};