// src/app/appointments/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO, addDays, setHours, setMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import Navigation from '@/components/Navigation';

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

// 利用可能なサービス一覧
const AVAILABLE_SERVICES = [
  { id: '1', name: 'カット', duration: 40, price: 4500 },
  { id: '2', name: 'カラー', duration: 90, price: 8000 },
  { id: '3', name: 'パーマ', duration: 120, price: 12000 },
  { id: '4', name: 'トリートメント', duration: 30, price: 3000 },
  { id: '5', name: 'ヘッドスパ', duration: 40, price: 5000 },
  { id: '6', name: 'シャンプー・ブロー', duration: 20, price: 2000 },
];

// 予約可能時間枠（営業時間）
const BUSINESS_HOURS = {
  start: 9, // 9:00
  end: 19,  // 19:00（最終予約）
};

// 予約時間枠の間隔（分）
const TIME_SLOT_INTERVAL = 30;

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームの状態
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    selectedServiceIds: [] as string[],
    note: '',
  });

  // 合計金額と所要時間
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

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
        
        // 編集不可能な状態をチェック
        if (data.status !== 'scheduled') {
          setError('この予約は編集できません（キャンセル済み、または完了済み）');
          return;
        }
        
        setAppointment(data);
        
        // フォームデータを初期化
        const appointmentDate = parseISO(data.start);
        setFormData({
          date: format(appointmentDate, 'yyyy-MM-dd'),
          time: format(appointmentDate, 'HH:mm'),
          selectedServiceIds: data.services.map((service: Service) => service.id),
          note: data.note || '',
        });
        
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

  // サービス選択が変更されたときに合計を再計算
  useEffect(() => {
    const selectedServices = AVAILABLE_SERVICES.filter(service => 
      formData.selectedServiceIds.includes(service.id)
    );
    
    const price = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
    
    setTotalPrice(price);
    setTotalDuration(duration);
  }, [formData.selectedServiceIds]);

  // サービス選択の変更ハンドラ
  const handleServiceChange = (serviceId: string) => {
    let newSelectedServiceIds;
    
    if (formData.selectedServiceIds.includes(serviceId)) {
      newSelectedServiceIds = formData.selectedServiceIds.filter(id => id !== serviceId);
    } else {
      newSelectedServiceIds = [...formData.selectedServiceIds, serviceId];
    }
    
    setFormData({
      ...formData,
      selectedServiceIds: newSelectedServiceIds
    });
  };

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
    
    if (!appointment || saving) return;
    
    setSaving(true);

    try {
      // 選択されたサービスを取得
      const selectedServices = AVAILABLE_SERVICES.filter(service => 
        formData.selectedServiceIds.includes(service.id)
      );
      
      // 開始時間を解析
      const [startHour, startMinute] = formData.time.split(':').map(Number);
      const startDate = new Date(`${formData.date}T00:00:00`);
      const start = setMinutes(setHours(startDate, startHour), startMinute);
      
      // 終了時間を計算
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + totalDuration);
      
      // 予約タイトルを作成（サービス名をカンマで連結）
      const title = selectedServices.map(service => service.name).join(' & ');
      
      // 更新された予約データを作成
      const updatedAppointment = {
        ...appointment,
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        services: selectedServices,
        totalPrice,
        totalDuration,
        note: formData.note
      };
      
      // APIに更新データを送信
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAppointment),
      });

      if (!response.ok) {
        throw new Error('予約の更新に失敗しました');
      }

      // 成功メッセージを表示
      alert('予約が更新されました');
      
      // 詳細ページに戻る
      router.push(`/appointments/${appointment.id}`);
      
    } catch (err) {
      console.error('予約更新エラー:', err);
      alert(err instanceof Error ? err.message : '予約の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 時間選択肢の生成
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = BUSINESS_HOURS.start; hour <= BUSINESS_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += TIME_SLOT_INTERVAL) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(
          <option key={timeString} value={timeString}>
            {timeString}
          </option>
        );
      }
    }
    return options;
  };

  // 日付選択肢の生成（今日から14日間）
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dateValue = format(date, 'yyyy-MM-dd');
      const dateLabel = format(date, 'yyyy年M月d日(E)', { locale: ja });
      
      options.push(
        <option key={dateValue} value={dateValue}>
          {dateLabel}
        </option>
      );
    }
    
    return options;
  };

  // 予約終了時間の計算
  const calculateEndTime = () => {
    if (totalDuration === 0) return formData.time;
    
    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const startTime = setMinutes(setHours(new Date(), hours), minutes);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + totalDuration);
      
      return format(endTime, 'HH:mm');
    } catch (error) {
      console.error('時間計算エラー:', error);
      return formData.time;
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
                onClick={() => router.push(`/appointments/${params.id}`)}
                className="text-blue-600 hover:text-blue-800"
                disabled={saving}
              >
                ← 予約詳細に戻る
              </button>
            </div>
            <h1 className="text-2xl font-bold">予約を編集</h1>
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
                  onClick={() => router.push(`/appointments/${params.id}`)}
                  className="text-sm underline"
                >
                  予約詳細に戻る
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
          {!loading && !error && appointment && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-blue-50 border-b">
                <h2 className="text-xl font-semibold">予約を編集</h2>
                {saving && (
                  <div className="mt-2 text-sm text-blue-600">
                    保存中...
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* 顧客情報 - 読み取り専用 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">👤 顧客情報</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-lg font-medium">{appointment.clientName}</div>
                    <div className="text-gray-600">{appointment.phone}</div>
                  </div>
                </div>

                {/* 日時選択 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">📅 予約日時</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">日付</label>
                      <select
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      >
                        {generateDateOptions()}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">開始時間</label>
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      >
                        {generateTimeOptions()}
                      </select>
                    </div>
                  </div>
                </div>

                {/* サービス選択 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">📋 施術メニュー</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_SERVICES.map(service => (
                      <div 
                        key={service.id}
                        className={`border rounded-md p-3 cursor-pointer transition-colors ${
                          formData.selectedServiceIds.includes(service.id) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !saving && handleServiceChange(service.id)}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-gray-600">{service.price.toLocaleString()}円</span>
                        </div>
                        <div className="text-sm text-gray-500">所要時間: {service.duration}分</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 合計情報 */}
                {formData.selectedServiceIds.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">合計金額:</span>
                      <span className="font-medium">{totalPrice.toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">所要時間:</span>
                      <span className="font-medium">{totalDuration}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">終了予定時刻:</span>
                      <span className="font-medium">{calculateEndTime()}</span>
                    </div>
                  </div>
                )}

                {/* 備考 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">📝 備考</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="特記事項があればご記入ください"
                    disabled={saving}
                  ></textarea>
                </div>

                {/* 送信ボタン */}
                <div className="flex justify-end space-x-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/appointments/${params.id}`)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    disabled={saving}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-md ${
                      saving || formData.selectedServiceIds.length === 0
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={formData.selectedServiceIds.length === 0 || saving}
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