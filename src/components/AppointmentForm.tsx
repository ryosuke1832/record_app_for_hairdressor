// src/components/AppointmentForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import CustomerSuggestionsModal from './CustomerSuggestionsModal';
import BulkAdjustmentModal from './BulkAdjustmentModal';
import ServiceAdjustmentModal from './ServiceAdjustmentModal';
import { AdjustableService } from '@/types/appointment';

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
  const searchParams = useSearchParams();
  
  // URLパラメータから顧客情報を取得
  const preSelectedCustomerId = searchParams.get('customerId');
  const preSelectedCustomerName = searchParams.get('customerName');
  
  const [step, setStep] = useState(preSelectedCustomerId ? 2 : 1); // 顧客が事前選択されている場合はステップ2から開始
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(!preSelectedCustomerId); // 事前選択がある場合は顧客読み込みをスキップ
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 調整可能サービスの状態
  const [adjustableServices, setAdjustableServices] = useState<AdjustableService[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showBulkAdjustment, setShowBulkAdjustment] = useState(false);
  const [showServiceAdjustment, setShowServiceAdjustment] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: preSelectedCustomerId || '',
    customerName: preSelectedCustomerName ? decodeURIComponent(preSelectedCustomerName) : '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    time: initialTime || '10:00',
    note: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // 顧客データを取得（事前選択がない場合のみ）
  useEffect(() => {
    if (preSelectedCustomerId) {
      // 事前に選択された顧客がいる場合は、顧客データの読み込みをスキップ
      setLoadingCustomers(false);
      return;
    }

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
  }, [preSelectedCustomerId]);

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

  // 選択中のサービスの計算
  const calculateTotals = (selectedServices: AdjustableService[]) => {
    const price = selectedServices.reduce((sum, service) => 
      sum + (service.isAdjusted ? service.adjustedPrice : service.basePrice), 0
    );
    const duration = selectedServices.reduce((sum, service) => 
      sum + (service.isAdjusted ? service.adjustedDuration : service.baseDuration), 0
    );
    
    setTotalPrice(price);
    setTotalDuration(duration);
  };

  // サービス選択の変更ハンドラ
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const existingIndex = adjustableServices.findIndex(s => s.id === serviceId);
    
    if (existingIndex >= 0) {
      // サービスを削除
      const newServices = adjustableServices.filter(s => s.id !== serviceId);
      setAdjustableServices(newServices);
      calculateTotals(newServices);
    } else {
      // サービスを追加
      const newService: AdjustableService = {
        id: service.id,
        name: service.name,
        baseDuration: service.duration,
        adjustedDuration: service.duration,
        basePrice: service.price,
        adjustedPrice: service.price,
        isAdjusted: false
      };
      const newServices = [...adjustableServices, newService];
      setAdjustableServices(newServices);
      calculateTotals(newServices);
    }
  };

  // 個別サービス調整
  const handleServiceAdjustment = (serviceId: string, duration: number, price: number, reason?: string) => {
    const newServices = adjustableServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          adjustedDuration: duration,
          adjustedPrice: price,
          isAdjusted: duration !== service.baseDuration || price !== service.basePrice,
          adjustmentReason: reason
        };
      }
      return service;
    });
    
    setAdjustableServices(newServices);
    calculateTotals(newServices);
  };

  // サービスリセット
  const handleServiceReset = (serviceId: string) => {
    const newServices = adjustableServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          adjustedDuration: service.baseDuration,
          adjustedPrice: service.basePrice,
          isAdjusted: false,
          adjustmentReason: undefined
        };
      }
      return service;
    });
    
    setAdjustableServices(newServices);
    calculateTotals(newServices);
  };

  // 顧客サジェスト適用
  const handleApplyCustomerSuggestions = (suggestedServices: AdjustableService[]) => {
    setAdjustableServices(suggestedServices);
    calculateTotals(suggestedServices);
  };

  // 一括調整適用
  const handleBulkAdjustment = (adjustedServices: AdjustableService[]) => {
    setAdjustableServices(adjustedServices);
    calculateTotals(adjustedServices);
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

  // 顧客変更ハンドラ（ステップ2から顧客を変更する場合）
  const handleChangeCustomer = () => {
    if (!preSelectedCustomerId) {
      // 通常の顧客選択フローに戻る
      setStep(1);
    } else {
      // 事前選択された顧客がいる場合は顧客一覧ページに戻る
      router.push('/customers');
    }
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
      // 開始時間を作成
      const [startHour, startMinute] = formData.time.split(':').map(Number);
      const startDate = new Date(`${formData.date}T00:00:00`);
      const start = setMinutes(setHours(startDate, startHour), startMinute);
      
      // 終了時間を計算
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + totalDuration);

      // 顧客情報を取得
      const selectedCustomer = customers.find(customer => customer.id === formData.customerId);
      
      // 調整済みサービスを標準形式に変換
      const finalServices = adjustableServices.map(service => ({
        id: service.id,
        name: service.name,
        duration: service.isAdjusted ? service.adjustedDuration : service.baseDuration,
        price: service.isAdjusted ? service.adjustedPrice : service.basePrice
      }));
      
      // APIに送信するデータを作成
      const appointmentData = {
        clientName: formData.customerName,
        phone: selectedCustomer?.phone || '',
        start: start.toISOString(),
        end: end.toISOString(),
        services: finalServices,
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
      
      // 事前選択された顧客がいる場合は顧客詳細ページに戻る
      if (preSelectedCustomerId) {
        router.push(`/customers/${preSelectedCustomerId}`);
      } else {
        router.push('/calendar');
      }
      
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

  // 顧客フィルタリング
  const filteredCustomers = customers.filter(
    (customer) => 
      customer.name.includes(searchQuery) || 
      customer.kana.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
  );

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
        
        {/* 事前選択された顧客がいる場合の情報表示 */}
        {preSelectedCustomerId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">選択された顧客</p>
                <p className="font-medium text-blue-900">{formData.customerName}</p>
              </div>
              <button
                type="button"
                onClick={handleChangeCustomer}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                顧客を変更
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ステップ1: 顧客選択（事前選択がない場合のみ表示） */}
        {step === 1 && !preSelectedCustomerId && (
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
                onClick={() => preSelectedCustomerId ? handleChangeCustomer() : setStep(1)}
                disabled={isSubmitting}
              >
                {preSelectedCustomerId ? '顧客変更' : '戻る'}
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

        {/* ステップ3: サービス選択と調整 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">施術内容を選択</h2>
            
            <div className="mb-4">
              <p className="font-medium mb-2">顧客: {formData.customerName}</p>
              <p className="font-medium mb-2">
                予約日時: {format(new Date(formData.date), 'yyyy年M月d日(E)', { locale: ja })} {formData.time}
              </p>
            </div>
            
            {/* 調整機能ボタン */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setShowCustomerSuggestions(true)}
                disabled={adjustableServices.length === 0 || !formData.customerId}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
              >
                過去の実績から提案
              </button>
              <button
                type="button"
                onClick={() => setShowBulkAdjustment(true)}
                disabled={adjustableServices.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
              >
                一括調整
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">施術メニュー</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(service => {
                  const isSelected = adjustableServices.some(s => s.id === service.id);
                  const adjustedService = adjustableServices.find(s => s.id === service.id);
                  
                  return (
                    <div 
                      key={service.id}
                      className={`border rounded-md p-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isSubmitting && handleServiceChange(service.id)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{service.name}</span>
                        <span className={`text-gray-600 ${
                          adjustedService?.isAdjusted ? 'line-through text-red-500' : ''
                        }`}>
                          {service.price.toLocaleString()}円
                        </span>
                      </div>
                      <div className={`text-sm text-gray-500 ${
                        adjustedService?.isAdjusted ? 'line-through text-red-400' : ''
                      }`}>
                        所要時間: {service.duration}分
                      </div>
                      
                      {/* 調整後の値を表示 */}
                      {adjustedService?.isAdjusted && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <div className="text-blue-600 font-medium">
                            調整後: {adjustedService.adjustedPrice.toLocaleString()}円 / {adjustedService.adjustedDuration}分
                          </div>
                          {adjustedService.adjustmentReason && (
                            <div className="text-gray-600 text-xs mt-1">
                              理由: {adjustedService.adjustmentReason}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowServiceAdjustment(service.id);
                              }}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              調整
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceReset(service.id);
                              }}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                            >
                              リセット
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {service.category && (
                        <div className="text-xs text-gray-400">{service.category}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {adjustableServices.length > 0 && (
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
                disabled={adjustableServices.length === 0 || isSubmitting}
              >
                {isSubmitting ? '登録中...' : '予約を登録'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* モーダル */}
      {showCustomerSuggestions && (
        <CustomerSuggestionsModal
          customerId={formData.customerId}
          selectedServices={adjustableServices}
          onApplySuggestions={handleApplyCustomerSuggestions}
          onClose={() => setShowCustomerSuggestions(false)}
        />
      )}
      
      {showBulkAdjustment && (
        <BulkAdjustmentModal
          selectedServices={adjustableServices}
          onBulkAdjustment={handleBulkAdjustment}
          onClose={() => setShowBulkAdjustment(false)}
        />
      )}

      {showServiceAdjustment && (
        <ServiceAdjustmentModal
          serviceId={showServiceAdjustment}
          service={adjustableServices.find(s => s.id === showServiceAdjustment)!}
          onSave={handleServiceAdjustment}
          onClose={() => setShowServiceAdjustment(null)}
          onReset={handleServiceReset}
        />
      )}
    </div>
  );
}