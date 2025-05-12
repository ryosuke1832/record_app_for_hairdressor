// src/components/AppointmentEdit.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes, addDays } from 'date-fns';
import {ja} from 'date-fns/locale/ja';

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
};

type AppointmentEditProps = {
  appointment: Appointment;
  onSave: (updatedAppointment: Appointment) => void;
  onCancel: () => void;
};

// 利用可能なサービス一覧（実際のアプリではAPIから取得します）
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

export default function AppointmentEdit({ 
  appointment, 
  onSave, 
  onCancel 
}: AppointmentEditProps) {
  // フォームの状態
  const [formData, setFormData] = useState({
    date: format(parseISO(appointment.start), 'yyyy-MM-dd'),
    time: format(parseISO(appointment.start), 'HH:mm'),
    selectedServiceIds: appointment.services.map(service => service.id),
    note: appointment.note,
  });

  // 合計金額と所要時間
  const [totalPrice, setTotalPrice] = useState(appointment.totalPrice);
  const [totalDuration, setTotalDuration] = useState(appointment.totalDuration);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    const updatedAppointment: Appointment = {
      ...appointment,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      services: selectedServices,
      totalPrice,
      totalDuration,
      note: formData.note
    };
    
    // 保存処理を呼び出す
    onSave(updatedAppointment);
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-50 border-b">
        <h2 className="text-xl font-semibold">予約を編集</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* 顧客情報 - 読み取り専用 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">顧客情報</h3>
          <div className="text-lg font-medium">{appointment.clientName}</div>
          <div className="text-gray-600">{appointment.phone}</div>
        </div>

        {/* 日時選択 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">予約日時</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">日付</label>
              <select
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              >
                {generateTimeOptions()}
              </select>
            </div>
          </div>
        </div>

        {/* サービス選択 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">施術メニュー</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_SERVICES.map(service => (
              <div 
                key={service.id}
                className={`border rounded-md p-3 cursor-pointer transition-colors ${
                  formData.selectedServiceIds.includes(service.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleServiceChange(service.id)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="特記事項があればご記入ください"
          ></textarea>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-3 border-t pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={formData.selectedServiceIds.length === 0}
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}