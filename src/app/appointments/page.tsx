// src/app/appointments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AppointmentStatusBadge from '@/components/AppointmentStatusBadge';

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

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 予約データを取得
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/appointments');
        if (!response.ok) {
          throw new Error('予約データの取得に失敗しました');
        }
        
        const data = await response.json();
        
        // 日付順でソート（今日以降を優先、その後過去データ）
        const today = startOfDay(new Date());
        const sortedAppointments = data.sort((a: Appointment, b: Appointment) => {
          const dateA = parseISO(a.start);
          const dateB = parseISO(b.start);
          
          const isAFuture = !isBefore(dateA, today);
          const isBFuture = !isBefore(dateB, today);
          
          // 今日以降のデータを先に、過去のデータを後に
          if (isAFuture && !isBFuture) return -1;
          if (!isAFuture && isBFuture) return 1;
          
          // 同じグループ内では日付順
          return dateA.getTime() - dateB.getTime();
        });
        
        setAppointments(sortedAppointments);
      } catch (err) {
        console.error('予約データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // フィルタリング処理
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 今日以降と過去の予約を分ける
  const today = startOfDay(new Date());
  const futureAppointments = filteredAppointments.filter(
    appointment => !isBefore(parseISO(appointment.start), today)
  );
  const pastAppointments = filteredAppointments.filter(
    appointment => isBefore(parseISO(appointment.start), today)
  );

  // 予約カードをクリック
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  // 新規予約ボタン
  const handleNewAppointment = () => {
    router.push('/appointments/new');
  };

  // 予約カードコンポーネント
  const AppointmentCard = ({ 
    appointment, 
    isPast = false 
  }: { 
    appointment: Appointment, 
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
        onClick={() => handleAppointmentClick(appointment.id)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
              {appointment.title}
            </h3>
            <p className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
              {appointment.clientName}
            </p>
          </div>
          <AppointmentStatusBadge 
            status={appointment.status} 
            className={isPast ? 'opacity-75' : ''}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            <div className="font-medium">📅 日時</div>
            <div>
              {format(appointmentDate, 'yyyy年M月d日(E)', { locale: ja })}
            </div>
            <div>
              {format(appointmentDate, 'HH:mm')} - {format(appointmentEnd, 'HH:mm')}
            </div>
          </div>
          
          <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            <div className="font-medium">💰 料金・時間</div>
            <div>
              {appointment.totalPrice.toLocaleString()}円
            </div>
            <div>
              {appointment.totalDuration}分
            </div>
          </div>
        </div>
        
        <div className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
          <div className="font-medium mb-1">📋 施術内容</div>
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
        
        {appointment.note && (
          <div className={`mt-2 text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            <div className="font-medium">📝 備考</div>
            <div className="text-xs mt-1 truncate">
              {appointment.note}
            </div>
          </div>
        )}
        
        <div className={`mt-2 text-xs ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
          <div>📞 {appointment.phone}</div>
        </div>
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
            <h1 className="text-2xl font-bold">予約一覧</h1>
            <button
              onClick={handleNewAppointment}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
            >
              新規予約
            </button>
          </div>

          {/* 検索・フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  検索
                </label>
                <input
                  type="text"
                  placeholder="顧客名、施術内容、電話番号で検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="scheduled">予約済み</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
            </div>
          </div>

          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">予約データを読み込み中...</p>
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

          {/* 予約一覧 */}
          {!loading && !error && (
            <div>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">予約が見つかりませんでした</p>
                  <button
                    onClick={handleNewAppointment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    新規予約を作成
                  </button>
                </div>
              ) : (
                <div>
                  {/* 今日以降の予約 */}
                  {futureAppointments.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 text-gray-900">
                        今後の予約 ({futureAppointments.length}件)
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {futureAppointments.map(appointment => (
                          <AppointmentCard 
                            key={appointment.id} 
                            appointment={appointment} 
                            isPast={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 過去の予約 */}
                  {pastAppointments.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 text-gray-600">
                        過去の予約 ({pastAppointments.length}件)
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastAppointments.map(appointment => (
                          <AppointmentCard 
                            key={appointment.id} 
                            appointment={appointment} 
                            isPast={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}