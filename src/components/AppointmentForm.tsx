// src/components/AppointmentForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, setHours, setMinutes, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

// 顧客データの型定義
type Customer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  email?: string;
};

// サービスデータの型定義
type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
  isActive: boolean;
};

// 予約可能時間枠（営業時間）
const BUSINESS_HOURS = {
  start: 9, // 9:00
  end: 19,  // 19:00（最終予約）
};

// 予約時間枠の間隔（分）
const TIME_SLOT_INTERVAL = 30;

// プロップスの型定義
type AppointmentFormProps = {
  initialDate?: string | null;
  initialTime?: string | null;
};

export default function AppointmentForm({ initialDate, initialTime }: AppointmentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    time: initialTime || '10:00',
    selectedServices: [] as string[],
    note: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // 顧客データを取得
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('顧客データの取得に失敗しました');
        }
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error('顧客データ取得エラー:', err);
        setError('顧客データの取得に失敗しました');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // サービスデータを取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await fetch('/api/services?isActive=true');
        if (!response.ok) {
          throw new Error('サービスデータの取得に失敗しました');
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error('サービスデータ取得エラー:', err);
        setError('サービスデータの取得に失敗しました');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // 初期値が設定されている場合の処理
  useEffect(() => {
    if (initialDate || initialTime) {
      console.log('初期値が設定されています:', { initialDate, initialTime });
    }
  }, [initialDate, initialTime]);

  // 顧客フィルタリング
  const filteredCustomers = customers.filter(
    (customer) => 
      customer.name.includes(searchQuery) || 
      customer.kana.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
  );

  // 選択中のサービスの計算
  const calculateTotals = (selectedIds: string[]) => {
    const selectedServiceData = services.filter(service => 
      selectedIds.includes(service.id)
    );
    
    const price = selectedServiceData.reduce((sum, service) => sum + service.price, 0);
    const duration = selectedServiceData.reduce((sum, service) => sum + service.duration, 0);
    
    setTotalPrice(price);
    setTotalDuration(duration);
  };

  // サービス選択の変更ハンドラ
  const handleServiceChange = (serviceId: string) => {
    let newSelectedServices;
    
    if (formData.selectedServices.includes(serviceId)) {
      newSelectedServices = formData.selectedServices.filter(id => id !== serviceId);
    } else {
      newSelectedServices = [...formData.selectedServices, serviceId];
    }
    
    setFormData({
      ...formData,
      selectedServices: newSelectedServices
    });
    
    calculateTotals(newSelectedServices);
  };

  // 顧客選択ハンドラ
  const handleCustomerSelect = (customer: Customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name
    });
    setStep(2);
  };

  // フォーム入力ハンドラ
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
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // 選択されたサービスデータを取得
      const selectedServiceData = services.filter(service => 
        formData.selectedServices.includes(service.id)
      );

      // 開始時間を作成
      const [startHour, startMinute] = formData.time.split(':').map(Number);
      const startDate = new Date(`${formData.date}T00:00:00`);
      const start = setMinutes(setHours(startDate, startHour), startMinute);
      
      // 終了時間を計算
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + totalDuration);

      // 顧客情報を取得
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      
      // APIに送信するデータを作成
      const appointmentData = {
        clientName: formData.customerName,
        phone: selectedCustomer?.phone || '',
        start: start.toISOString(),
        end: end.toISOString(),
        services: selectedServiceData,
        totalPrice: totalPrice,
        totalDuration: totalDuration,
        note: formData.note,
        clientId: formData.customerId
      };

      // APIに予約データを送信
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('予約の登録に失敗しました');
      }

      const createdAppointment = await response.json();
      console.log('予約が作成されました:', createdAppointment);

      alert('予約が登録されました');
      router.push('/calendar');
      
    } catch (error) {
      console.error('予約登録エラー:', error);
      alert(error instanceof Error ? error.message : '予約の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
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

  // エラー表示
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // ローディング表示
  if (loadingCustomers || loadingServices) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            1
          </div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            2
          </div>
          <div className={`h-1 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>
            3
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ステップ1: 顧客選択 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">顧客を選択</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="顧客名・ふりがな・電話番号で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-md">
              {filteredCustomers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredCustomers.map(customer => (
                    <li 
                      key={customer.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  顧客が見つかりません
                </div>
              )}
            </div>
            
            <div className="mt-4 text-right">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                onClick={() => router.push('/calendar')}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                onClick={() => setStep(2)}
                disabled={!formData.customerId || isSubmitting}
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ2: 日時選択 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">日時を選択</h2>
            
            <div className="mb-4">
              <p className="font-medium mb-2">顧客: {formData.customerName}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予約日</label>
                <select
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {generateDateOptions()}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {generateTimeOptions()}
                </select>
              </div>
            </div>
            
            <div className="mt-4 text-right">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ3: サービス選択と確認 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">施術内容を選択</h2>
            
            <div className="mb-4">
              <p className="font-medium mb-2">顧客: {formData.customerName}</p>
              <p className="font-medium mb-2">
                予約日時: {format(parseISO(formData.date), 'yyyy年M月d日(E)', { locale: ja })} {formData.time}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">施術メニュー</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(service => (
                  <div 
                    key={service.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${
                      formData.selectedServices.includes(service.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isSubmitting && handleServiceChange(service.id)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-gray-600">{service.price.toLocaleString()}円</span>
                    </div>
                    <div className="text-sm text-gray-500">所要時間: {service.duration}分</div>
                    {service.category && (
                      <div className="text-xs text-gray-400">{service.category}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {formData.selectedServices.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
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
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="特記事項があればご記入ください"
                disabled={isSubmitting}
              ></textarea>
            </div>
            
            <div className="mt-4 text-right">
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
              >
                戻る
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                disabled={formData.selectedServices.length === 0 || isSubmitting}
              >
                {isSubmitting ? '登録中...' : '予約を登録'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}