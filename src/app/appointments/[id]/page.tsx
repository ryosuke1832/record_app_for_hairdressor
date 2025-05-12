'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AppointmentEdit from '@/components/AppointmentEdit';

// ダミーの予約データ（実際の実装ではAPIから取得します）
const dummyAppointments = [
  {
    id: '1',
    title: 'カット & カラー',
    start: '2025-05-11T10:00:00',
    end: '2025-05-11T11:30:00',
    clientId: '1',
    clientName: '田中 さくら',
    phone: '090-1234-5678',
    services: [
      { id: '1', name: 'カット', duration: 40, price: 4500 },
      { id: '2', name: 'カラー', duration: 90, price: 8000 }
    ],
    totalPrice: 12500,
    totalDuration: 130,
    note: 'アッシュブラウンでお願いします',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' // scheduled, completed, cancelled
  },
  {
    id: '2',
    title: 'パーマ',
    start: '2025-05-12T14:00:00',
    end: '2025-05-12T16:00:00',
    clientId: '2',
    clientName: '鈴木 健太',
    phone: '090-8765-4321',
    services: [
      { id: '3', name: 'パーマ', duration: 120, price: 12000 }
    ],
    totalPrice: 12000,
    totalDuration: 120,
    note: '前回よりも強めにかけてほしいとのこと',
    status: 'scheduled' as 'scheduled'
  },
  {
    id: '3',
    title: 'ヘッドスパ',
    start: '2025-05-13T11:00:00',
    end: '2025-05-13T12:00:00',
    clientId: '3',
    clientName: '伊藤 めぐみ',
    phone: '090-2468-1357',
    services: [
      { id: '5', name: 'ヘッドスパ', duration: 40, price: 5000 },
      { id: '4', name: 'トリートメント', duration: 30, price: 3000 }
    ],
    totalPrice: 8000,
    totalDuration: 70,
    note: 'アロマはラベンダーが好みです',
    status: 'scheduled' as 'scheduled'
  }
];

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<typeof dummyAppointments[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 実際のアプリではAPIから予約データを取得します
    const fetchAppointment = () => {
      try {
        setIsLoading(true);
        
        // IDを取得してデータを検索
        const id = params.id as string;
        const foundAppointment = dummyAppointments.find(appt => appt.id === id);
        
        if (foundAppointment) {
          // 予約済み状態以外は編集できない
          if (foundAppointment.status !== 'scheduled') {
            setError('この予約は編集できません（キャンセル済み、または完了済み）');
            return;
          }
          
          setAppointment(foundAppointment);
          setError(null);
        } else {
          setError('予約が見つかりませんでした');
        }
      } catch (err) {
        console.error('予約データの取得に失敗しました', err);
        setError('予約データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [params.id]);

  // 編集後のデータを保存
  const handleSave = (updatedAppointment: typeof dummyAppointments[0]) => {
    // 実際のアプリではAPIにデータを送信します
    console.log('更新する予約データ:', updatedAppointment);
    
    // 成功メッセージを表示
    alert('予約が更新されました');
    
    // 詳細ページに戻る
    router.push(`/appointments/${updatedAppointment.id}`);
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push(`/appointments/${params.id}`);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">予約を編集</h1>
            <button
              onClick={() => router.push(`/appointments/${params.id}`)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p>{error}</p>
              <button 
                onClick={() => router.push(`/appointments/${params.id}`)}
                className="mt-2 text-sm underline"
              >
                予約詳細に戻る
              </button>
            </div>
          ) : appointment ? (
            <AppointmentEdit 
              appointment={appointment} 
              onSave={handleSave} 
              onCancel={handleCancel} 
            />
          ) : (
            <p>予約データが存在しません</p>
          )}
        </div>
      </main>
    </>
  );
}