// src/components/AppointmentForm.tsx - 完全版
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, setHours, setMinutes, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AdjustableService, Customer, Service } from '@/types/appointment';
import BulkAdjustmentModal from './BulkAdjustmentModal';
import CustomerSuggestionsModal from './CustomerSuggestionsModal';

// 基本データ型定義
const DUMMY_CUSTOMERS: Customer[] = [
  { id: '1', name: '田中 さくら', kana: 'タナカ サクラ', phone: '090-1234-5678' },
  { id: '2', name: '佐藤 健太', kana: 'サトウ ケンタ', phone: '090-8765-4321' },
  { id: '3', name: '鈴木 めぐみ', kana: 'スズキ メグミ', phone: '090-2468-1357' },
  { id: '4', name: '伊藤 陽子', kana: 'イトウ ヨウコ', phone: '090-1357-2468' },
  { id: '5', name: '渡辺 大輔', kana: 'ワタナベ ダイスケ', phone: '090-3698-7412' },
];

const DUMMY_SERVICES: Service[] = [
  { id: '1', name: 'カット', duration: 40, price: 4500 },
  { id: '2', name: 'カラー', duration: 90, price: 8000 },
  { id: '3', name: 'パーマ', duration: 120, price: 12000 },
  { id: '4', name: 'トリートメント', duration: 30, price: 3000 },
  { id: '5', name: 'ヘッドスパ', duration: 40, price: 5000 },
  { id: '6', name: 'シャンプー・ブロー', duration: 20, price: 2000 },
];

const BUSINESS_HOURS = { start: 9, end: 19 };
const TIME_SLOT_INTERVAL = 30;

type AppointmentFormProps = {
  initialDate?: string | null;
  initialTime?: string | null;
};

export default function AppointmentForm({ initialDate, initialTime }: AppointmentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    time: initialTime || '10:00',
    selectedServices: [] as string[],
    note: '',
  });
  
  // サービス関連の状態
  const [adjustableServices, setAdjustableServices] = useState<AdjustableService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // モーダル制御
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<string | null>(null);
  const [showBulkAdjustment, setShowBulkAdjustment] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  
  // 顧客履歴データ
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [hasSuggestions, setHasSuggestions] = useState(false);

  // 顧客フィルタリング
  const filteredCustomers = DUMMY_CUSTOMERS.filter(
    (customer) => 
      customer.name.includes(searchQuery) || 
      customer.kana.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
  );

  // 顧客が選択されたときに履歴を取得
  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerHistory(formData.customerId);
    }
  }, [formData.customerId]);

  // 顧客履歴を取得
  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/history?completedOnly=true`);
      if (response.ok) {
        const history = await response.json();
        setCustomerHistory(history);
        
        // 提案があるかチェック
        const hasAdjustmentHistory = history.some((apt: any) => 
          apt.services.some((service: any) => {
            const baseService = DUMMY_SERVICES.find(s => s.id === service.id);
            return baseService && (
              service.duration !== baseService.duration || 
              service.price !== baseService.price
            );
          })
        );
        setHasSuggestions(hasAdjustmentHistory);
      }
    } catch (error) {
      console.error('履歴取得エラー:', error);
    }
  };

  // サービス選択の変更
  const handleServiceChange = (serviceId: string) => {
    let newSelectedServices;
    let newAdjustableServices = [...adjustableServices];
    
    if (formData.selectedServices.includes(serviceId)) {
      newSelectedServices = formData.selectedServices.filter(id => id !== serviceId);
      newAdjustableServices = newAdjustableServices.filter(s => s.id !== serviceId);
    } else {
      newSelectedServices = [...formData.selectedServices, serviceId];
      const baseService = DUMMY_SERVICES.find(s => s.id === serviceId);
      if (baseService) {
        newAdjustableServices.push({
          id: serviceId,
          name: baseService.name,
          baseDuration: baseService.duration,
          adjustedDuration: baseService.duration,
          basePrice: baseService.price,
          adjustedPrice: baseService.price,
          isAdjusted: false
        });
      }
    }
    
    setFormData({ ...formData, selectedServices: newSelectedServices });
    setAdjustableServices(newAdjustableServices);
    calculateTotals(newAdjustableServices);
  };

  // 合計計算
  const calculateTotals = (services: AdjustableService[]) => {
    const price = services.reduce((sum, service) => sum + service.adjustedPrice, 0);
    const duration = services.reduce((sum, service) => sum + service.adjustedDuration, 0);
    setTotalPrice(price);
    setTotalDuration(duration);
  };

  // 個別サービス調整の保存
  const handleServiceAdjustment = (serviceId: string, newDuration: number, newPrice: number, reason?: string) => {
    const updatedServices = adjustableServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          adjustedDuration: newDuration,
          adjustedPrice: newPrice,
          isAdjusted: newDuration !== service.baseDuration || newPrice !== service.basePrice,
          adjustmentReason: reason
        };
      }
      return service;
    });
    
    setAdjustableServices(updatedServices);
    calculateTotals(updatedServices);
    setShowAdjustmentModal(null);
  };

  // サービス調整のリセット
  const handleResetService = (serviceId: string) => {
    const updatedServices = adjustableServices.map(service => {
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
    
    setAdjustableServices(updatedServices);
    calculateTotals(updatedServices);
  };

  // 一括調整の適用
  const handleBulkAdjustment = (adjustedServices: AdjustableService[]) => {
    setAdjustableServices(adjustedServices);
    calculateTotals(adjustedServices);
  };

  // 履歴提案の適用
  const handleApplySuggestions = (suggestedServices: AdjustableService[]) => {
    setAdjustableServices(suggestedServices);
    calculateTotals(suggestedServices);
  };

  // 顧客選択ハンドラ
  const handleCustomerSelect = (customer: typeof DUMMY_CUSTOMERS[0]) => {
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
    setFormData({ ...formData, [name]: value });
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const selectedServices = adjustableServices.map(service => ({
        id: service.id,
        name: service.name,
        duration: service.adjustedDuration,
        price: service.adjustedPrice
      }));

      const [startHour, startMinute] = formData.time.split(':').map(Number);
      const startDate = new Date(`${formData.date}T00:00:00`);
      const start = setMinutes(setHours(startDate, startHour), startMinute);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + totalDuration);

      const selectedCustomer = DUMMY_CUSTOMERS.find(customer => customer.id === formData.customerId);
      
      const appointmentData = {
        clientName: formData.customerName,
        phone: selectedCustomer?.phone || '',
        start: start.toISOString(),
        end: end.toISOString(),
        services: selectedServices,
        totalPrice: totalPrice,
        totalDuration: totalDuration,
        note: formData.note,
        clientId: formData.customerId
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('予約の登録に失敗しました');
      }

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
          <option key={timeString} value={timeString}>{timeString}</option>
        );
      }
    }
    return options;
  };

  // 日付選択肢の生成
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dateValue = format(date, 'yyyy-MM-dd');
      const dateLabel = format(date, 'yyyy年M月d日(E)', { locale: ja });
      
      options.push(
        <option key={dateValue} value={dateValue}>{dateLabel}</option>
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

  // 個別調整モーダル
  const ServiceAdjustmentModal = ({ serviceId }: { serviceId: string }) => {
    const service = adjustableServices.find(s => s.id === serviceId);
    if (!service) return null;

    const [duration, setDuration] = useState(service.adjustedDuration);
    const [price, setPrice] = useState(service.adjustedPrice);
    const [reason, setReason] = useState(service.adjustmentReason || '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">{service.name} の調整</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所要時間（分）
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min="5"
                  max="300"
                  step="5"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">
                  (標準: {service.baseDuration}分)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                料金（円）
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value))}
                  min="0"
                  step="100"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">
                  (標準: {service.basePrice.toLocaleString()}円)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                調整理由
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 初回来店のため、髪が長いため"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAdjustmentModal(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleResetService(serviceId)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              標準に戻す
            </button>
            <button
              onClick={() => handleServiceAdjustment(serviceId, duration, price, reason)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* プログレスインジケーター */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>1</div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>2</div>
          <div className={`h-1 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'
          }`}>3</div>
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
                <div className="p-4 text-center text-gray-500">顧客が見つかりません</div>
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

        {/* ステップ3: サービス選択と調整 */}
        {step === 3 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">施術内容を選択・調整</h2>
              
              {/* 調整機能ボタン */}
              <div className="flex space-x-2">
                {hasSuggestions && formData.selectedServices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCustomerSuggestions(true)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm"
                    disabled={isSubmitting}
                  >
                    📋 過去の実績
                  </button>
                )}
                
                {formData.selectedServices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowBulkAdjustment(true)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded text-sm"
                    disabled={isSubmitting}
                  >
                    🔧 一括調整
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="font-medium mb-2">顧客: {formData.customerName}</p>
              <p className="font-medium mb-2">
                予約日時: {format(parseISO(formData.date), 'yyyy年M月d日(E)', { locale: ja })} {formData.time}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">施術メニュー</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DUMMY_SERVICES.map(service => {
                  const isSelected = formData.selectedServices.includes(service.id);
                  const adjustedService = adjustableServices.find(s => s.id === service.id);
                  
                  return (
                    <div 
                      key={service.id}
                      className={`border rounded-md p-3 transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => !isSubmitting && handleServiceChange(service.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{service.name}</span>
                          <div className="text-right">
                            {adjustedService && adjustedService.isAdjusted ? (
                              <>
                                <div className="text-sm line-through text-gray-500">
                                  {service.price.toLocaleString()}円
                                </div>
                                <div className="text-blue-600 font-medium">
                                  {adjustedService.adjustedPrice.toLocaleString()}円
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-600">{service.price.toLocaleString()}円</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          所要時間: 
                          {adjustedService && adjustedService.isAdjusted ? (
                            <>
                              <span className="line-through mr-1">{service.duration}分</span>
                              <span className="text-blue-600 font-medium">
                                {adjustedService.adjustedDuration}分
                              </span>
                            </>
                          ) : (
                            <span>{service.duration}分</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 調整コントロール */}
                      {isSelected && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {adjustedService?.isAdjusted && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  調整済み
                                </span>
                              )}
                              {adjustedService?.adjustmentReason && (
                                <span className="text-xs text-gray-500" title={adjustedService.adjustmentReason}>
                                  💡 {adjustedService.adjustmentReason.slice(0, 10)}...
                                </span>
                              )}
                            </div>
                            <div className="space-x-1">
                              {adjustedService?.isAdjusted && (
                                <button
                                  type="button"
                                  onClick={() => handleResetService(service.id)}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                                  disabled={isSubmitting}
                                >
                                  リセット
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowAdjustmentModal(service.id)}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                                disabled={isSubmitting}
                              >
                                🔧 調整
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 合計情報 */}
            {formData.selectedServices.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">合計金額:</span>
                  <span className="font-medium text-lg">{totalPrice.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">所要時間:</span>
                  <span className="font-medium text-lg">{totalDuration}分</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">終了予定時刻:</span>
                  <span className="font-medium text-lg">{calculateEndTime()}</span>
                </div>
                
                {/* 調整サマリー */}
                {adjustableServices.some(s => s.isAdjusted) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">調整内容:</div>
                    {adjustableServices.filter(s => s.isAdjusted).map(service => (
                      <div key={service.id} className="text-xs text-gray-500 flex justify-between">
                        <span>{service.name}</span>
                        <span>
                          {service.adjustedPrice !== service.basePrice && (
                            <span className="mr-2">
                              {service.adjustedPrice > service.basePrice ? '+' : ''}
                              {(service.adjustedPrice - service.basePrice).toLocaleString()}円
                            </span>
                          )}
                          {service.adjustedDuration !== service.baseDuration && (
                            <span>
                              {service.adjustedDuration > service.baseDuration ? '+' : ''}
                              {service.adjustedDuration - service.baseDuration}分
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* 備考 */}
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
            
            {/* 警告メッセージ */}
            {totalDuration > 180 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-700">
                    施術時間が3時間を超えています。お客様の負担と予約枠の調整にご注意ください。
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-right">
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
                className={`px-6 py-2 rounded-md font-medium ${
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

      {/* モーダル群 */}
      {showAdjustmentModal && (
        <ServiceAdjustmentModal serviceId={showAdjustmentModal} />
      )}

      {showBulkAdjustment && (
        <BulkAdjustmentModal
          selectedServices={adjustableServices}
          onBulkAdjustment={handleBulkAdjustment}
          onClose={() => setShowBulkAdjustment(false)}
        />
      )}

      {showCustomerSuggestions && (
        <CustomerSuggestionsModal
          customerId={formData.customerId}
          selectedServices={adjustableServices}
          onApplySuggestions={handleApplySuggestions}
          onClose={() => setShowCustomerSuggestions(false)}
        />
      )}
    </div>
  );
}