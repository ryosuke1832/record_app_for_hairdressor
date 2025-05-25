// src/app/appointments/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
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

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'complete' | 'cancel' | null;
    message: string;
  }>({ type: null, message: '' });

  // 予約データを取得
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/appointments/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('予約が見つかりませんでした');
          } else {
            throw new Error('予約データの取得に失敗しました');
          }
          return;
        }
        
        const data = await response.json();
        setAppointment(data);
      } catch (err) {
        console.error('予約データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAppointment();
    }
  }, [params.id]);

  // 予約を完了にする
  const handleCompleteAppointment = async () => {
    if (!appointment) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointment,
          status: 'completed'
        }),
      });

      if (!response.ok) {
        throw new Error('予約の更新に失敗しました');
      }

      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setShowConfirmDialog({ type: null, message: '' });
      
      // 成功メッセージ
      alert('予約を完了しました');
      
    } catch (err) {
      console.error('予約更新エラー:', err);
      alert(err instanceof Error ? err.message : '予約の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 予約をキャンセルする
  const handleCancelAppointment = async () => {
    if (!appointment) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...appointment,
          status: 'cancelled'
        }),
      });

      if (!response.ok) {
        throw new Error('予約の更新に失敗しました');
      }

      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setShowConfirmDialog({ type: null, message: '' });
      
      // 成功メッセージ
      alert('予約をキャンセルしました');
      
    } catch (err) {
      console.error('予約更新エラー:', err);
      alert(err instanceof Error ? err.message : '予約の更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 編集ページへ移動
  const handleEditAppointment = () => {
    router.push(`/appointments/${params.id}/edit`);
  };

  // 確認ダイアログを表示
  const showConfirmation = (type: 'complete' | 'cancel') => {
    const messages = {
      complete: 'この予約を完了にしますか？',
      cancel: 'この予約をキャンセルしますか？'
    };
    
    setShowConfirmDialog({
      type,
      message: messages[type]
    });
  };

  // 予約が過去のデータかどうか判定
  const isPastAppointment = appointment ? isBefore(parseISO(appointment.start), startOfDay(new Date())) : false;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* ローディング表示 */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">予約データを読み込み中...</p>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p>{error}</p>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => router.push('/appointments')}
                  className="text-sm underline"
                >
                  予約一覧に戻る
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

          {/* 予約詳細 */}
          {!loading && !error && appointment && (
            <div>
              {/* ヘッダー */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/appointments')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← 予約一覧に戻る
                  </button>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  {appointment.status === 'scheduled' && !isPastAppointment && (
                    <>
                      <button
                        onClick={handleEditAppointment}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                        disabled={isUpdating}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => showConfirmation('complete')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                        disabled={isUpdating}
                      >
                        完了
                      </button>
                      <button
                        onClick={() => showConfirmation('cancel')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none"
                        disabled={isUpdating}
                      >
                        キャンセル
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 予約詳細カード */}
              <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
                isPastAppointment ? 'opacity-75' : ''
              }`}>
                {/* ステータスバナー */}
                <div className={`p-6 ${
                  appointment.status === 'scheduled' ? 'bg-blue-50' :
                  appointment.status === 'completed' ? 'bg-green-50' :
                  'bg-red-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {appointment.title}
                      </h1>
                      {isPastAppointment && (
                        <div className="inline-block bg-gray-500 text-white px-2 py-1 rounded text-xs mb-2">
                          過去の予約
                        </div>
                      )}
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                </div>

                <div className="p-6">
                  {/* 基本情報 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* 予約日時 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">📅 予約日時</h3>
                      <div className="text-lg font-medium">
                        {format(parseISO(appointment.start), 'yyyy年M月d日(E)', { locale: ja })}
                      </div>
                      <div className="text-lg">
                        {format(parseISO(appointment.start), 'HH:mm')} 〜 {format(parseISO(appointment.end), 'HH:mm')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        所要時間: {appointment.totalDuration}分
                      </div>
                    </div>

                    {/* 顧客情報 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">👤 顧客情報</h3>
                      <div className="text-lg font-medium">{appointment.clientName}</div>
                      <div className="text-gray-600">{appointment.phone}</div>
                    </div>
                  </div>

                  {/* 施術内容 */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">📋 施術内容</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              メニュー
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              時間
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              料金
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appointment.services.map((service) => (
                            <tr key={service.id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{service.name}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{service.duration}分</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">{service.price.toLocaleString()}円</div>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-medium" colSpan={2}>
                              合計
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {appointment.totalPrice.toLocaleString()}円
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 備考 */}
                  {appointment.note && (
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">📝 備考</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-gray-700 whitespace-pre-wrap">{appointment.note}</p>
                      </div>
                    </div>
                  )}

                  {/* メタデータ */}
                  <div className="border-t pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">作成日時:</span><br />
                        {format(parseISO(appointment.createdAt), 'yyyy年M月d日 HH:mm', { locale: ja })}
                      </div>
                      <div>
                        <span className="font-medium">更新日時:</span><br />
                        {format(parseISO(appointment.updatedAt), 'yyyy年M月d日 HH:mm', { locale: ja })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 確認ダイアログ */}
      {showConfirmDialog.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">確認</h3>
            <p className="text-gray-600 mb-6">{showConfirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog({ type: null, message: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={isUpdating}
              >
                キャンセル
              </button>
              <button
                onClick={showConfirmDialog.type === 'complete' ? handleCompleteAppointment : handleCancelAppointment}
                className={`px-4 py-2 text-white rounded-md ${
                  showConfirmDialog.type === 'complete' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isUpdating}
              >
                {isUpdating ? '処理中...' : '実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}