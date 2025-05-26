// src/components/CalendarView.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 曜日の表示用配列
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 設定データの型定義
type CalendarSettings = {
  timeRange: {
    startHour: number;
    endHour: number;
  };
  dayRange: {
    startDay: number; // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日
    endDay: number;
  };
  timeSlotInterval: number; // 分単位（15, 30, 60）
  showWeekends: boolean;
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

// カレンダー設定パネルのコンポーネント（インポート用）
import CalendarSettingsPanel from './CalendarSettingsPanel';

export default function CalendarView() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, hour: number} | null>(null);
  const [showLongPressIndicator, setShowLongPressIndicator] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // デフォルト設定
  const [settings, setSettings] = useState<CalendarSettings>({
    timeRange: { startHour: 8, endHour: 20 },
    dayRange: { startDay: 0, endDay: 6 },
    timeSlotInterval: 30,
    showWeekends: true
  });

  // 設定をローカルストレージから読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('calendarSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    }
  }, []);

  // 週の日付を生成（設定に応じて）
  useEffect(() => {
    const dates = [];
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 日曜始まり

    if (settings.showWeekends) {
      // カスタム範囲で表示
      for (let i = settings.dayRange.startDay; i <= settings.dayRange.endDay; i++) {
        dates.push(addDays(weekStart, i));
      }
    } else {
      // 平日のみ表示
      for (let i = 1; i <= 5; i++) { // 月曜日から金曜日
        dates.push(addDays(weekStart, i));
      }
    }
    
    setWeekDates(dates);
  }, [currentDate, settings]);

  // 予約データをAPIから取得
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
        setAppointments(data);
      } catch (err) {
        console.error('予約データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '予約データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // 前週へ移動
  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };

  // 次週へ移動
  const goToNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  // 今日へ移動
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 時間枠を生成（設定に応じて）
  const getTimeSlots = () => {
    const slots = [];
    const { startHour, endHour } = settings.timeRange;
    const interval = settings.timeSlotInterval;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      if (interval === 60) {
        slots.push(hour);
      } else {
        for (let minute = 0; minute < 60; minute += interval) {
          if (hour === endHour && minute > 0) break; // 最終時間は00分のみ
          slots.push(hour + minute / 60);
        }
      }
    }
    return slots;
  };

  // 時間表示のフォーマット
  const formatTimeSlot = (timeSlot: number) => {
    const hour = Math.floor(timeSlot);
    const minute = Math.round((timeSlot - hour) * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // 予約のステータスに応じた色を取得
  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-400';
      default:
        return 'bg-gray-500';
    }
  };

  // 予約を表示する関数
  const renderAppointment = (date: Date, timeSlot: number) => {
    const hour = Math.floor(timeSlot);
    const minute = Math.round((timeSlot - hour) * 60);
    
    return appointments.filter(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentHour = appointmentStart.getHours();
      const appointmentMinute = appointmentStart.getMinutes();
      
      return isSameDay(appointmentStart, date) && 
             appointmentHour === hour && 
             appointmentMinute === minute;
    }).map(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentEnd = parseISO(appointment.end);
      const slotDuration = settings.timeSlotInterval;
      const appointmentDuration = (appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60);
      const heightInSlots = appointmentDuration / slotDuration;
      
      return (
        <div 
          key={appointment.id}
          className={`${getAppointmentColor(appointment.status)} text-white rounded p-1 text-xs cursor-pointer hover:opacity-90 absolute w-full`}
          style={{
            height: `${heightInSlots * 100}%`,
            zIndex: 10
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleAppointmentClick(appointment.id);
          }}
        >
          <div className="font-bold truncate">{appointment.title}</div>
          <div className="truncate">{appointment.clientName}</div>
          <div className="text-xs">
            {format(appointmentStart, 'HH:mm')} - {format(appointmentEnd, 'HH:mm')}
          </div>
        </div>
      );
    });
  };

  // 予約クリック時の処理
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  // タイムスロットが予約済みかどうかをチェック
  const isSlotBooked = (date: Date, timeSlot: number) => {
    const hour = Math.floor(timeSlot);
    const minute = Math.round((timeSlot - hour) * 60);
    
    return appointments.some(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentEnd = parseISO(appointment.end);
      
      if (!isSameDay(appointmentStart, date)) return false;
      
      const slotTime = hour * 60 + minute;
      const startTime = appointmentStart.getHours() * 60 + appointmentStart.getMinutes();
      const endTime = appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();
      
      return slotTime >= startTime && slotTime < endTime;
    });
  };

  // 空きスロットをタップ/クリックした時の処理
  const handleSlotClick = (date: Date, timeSlot: number) => {
    if (isSlotBooked(date, timeSlot)) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const formattedTime = formatTimeSlot(timeSlot);
    
    router.push(`/appointments/new?date=${formattedDate}&time=${formattedTime}`);
  };

  // タイムスロットを長押しした時の処理（モバイル対応）
  const handleTouchStart = (date: Date, timeSlot: number) => {
    if (isSlotBooked(date, timeSlot)) return;

    setSelectedSlot({ date, hour: Math.floor(timeSlot) });
    
    const timer = setTimeout(() => {
      setShowLongPressIndicator(true);
      
      setTimeout(() => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const formattedTime = formatTimeSlot(timeSlot);
        router.push(`/appointments/new?date=${formattedDate}&time=${formattedTime}`);
      }, 500);
    }, 600);
    
    setLongPressTimer(timer);
  };

  // タッチ終了時の処理
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setSelectedSlot(null);
    setShowLongPressIndicator(false);
  };

  // 設定変更時の処理
  const handleSettingsChange = (newSettings: CalendarSettings) => {
    setSettings(newSettings);
    localStorage.setItem('calendarSettings', JSON.stringify(newSettings));
  };

  // エラー表示
  if (error) {
    return (
      <div className="p-4 mx-auto max-w-7xl">
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

  return (
    <div className="p-4 mx-auto max-w-7xl">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold mr-4">カレンダー</h1>
          <button 
            onClick={goToToday}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-1 rounded text-sm mr-2"
          >
            今日
          </button>
          <div className="flex items-center">
            <button 
              onClick={goToPreviousWeek}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              ◀
            </button>
            <span className="mx-2 text-lg font-semibold">
              {format(weekDates[0] || new Date(), 'yyyy年 M月')}
            </span>
            <button 
              onClick={goToNextWeek}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              ▶
            </button>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/appointments/new" className="flex-1 sm:flex-none">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm w-full">
              新規予約
            </button>
          </Link>
          <button 
            onClick={() => setShowSettings(true)}
            className="border border-gray-300 px-4 py-1 rounded text-sm flex-1 sm:flex-none hover:bg-gray-50"
          >
            表示設定
          </button>
        </div>
      </div>

      {/* 設定情報表示 */}
      <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        <div className="flex flex-wrap gap-4">
          <span>
            ⏰ {formatTimeSlot(settings.timeRange.startHour)} - {formatTimeSlot(settings.timeRange.endHour)}
          </span>
          <span>
            📅 {settings.showWeekends ? 
              `${WEEKDAYS[settings.dayRange.startDay]} - ${WEEKDAYS[settings.dayRange.endDay]}` : 
              '平日のみ'
            }
          </span>
          <span>
            🕐 {settings.timeSlotInterval}分間隔
          </span>
        </div>
      </div>

      {/* ローディング表示 */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">予約データを読み込み中...</p>
        </div>
      )}

      {/* カレンダーグリッド */}
      {!loading && (
        <div className="overflow-x-auto border border-gray-300 rounded">
          {/* 曜日ヘッダー */}
          <div className="grid border-b border-gray-300 bg-gray-100" style={{
            gridTemplateColumns: `60px repeat(${weekDates.length}, 1fr)`
          }}>
            <div className="p-2 border-r border-gray-300"></div>
            {weekDates.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              const dayNumber = format(date, 'd');
              const dayOfWeek = WEEKDAYS[date.getDay()];
              
              return (
                <div 
                  key={index} 
                  className={`p-2 text-center border-r border-gray-300 ${
                    isToday ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className={`text-sm ${date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : ''}`}>
                    {dayOfWeek}
                  </div>
                  <div className={`font-bold text-lg ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                    {dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 時間枠 */}
          {getTimeSlots().map((timeSlot, index) => {
            const isMainHour = timeSlot === Math.floor(timeSlot);
            const slotHeight = settings.timeSlotInterval === 15 ? 'h-8' : 
                              settings.timeSlotInterval === 30 ? 'h-12' : 'h-16';
            
            return (
              <div 
                key={index} 
                className={`grid border-b border-gray-300 ${slotHeight}`}
                style={{
                  gridTemplateColumns: `60px repeat(${weekDates.length}, 1fr)`
                }}
              >
                {/* 時間表示 */}
                <div className={`p-1 text-right text-xs text-gray-500 border-r border-gray-300 flex items-center justify-end ${
                  !isMainHour ? 'text-gray-400' : ''
                }`}>
                  {isMainHour || settings.timeSlotInterval >= 30 ? formatTimeSlot(timeSlot) : ''}
                </div>
                
                {/* 各曜日の時間枠 */}
                {weekDates.map((date, dateIndex) => {
                  const booked = isSlotBooked(date, timeSlot);
                  const isSelected = selectedSlot && 
                                    isSameDay(selectedSlot.date, date) && 
                                    selectedSlot.hour === Math.floor(timeSlot);
                  
                  return (
                    <div 
                      key={dateIndex} 
                      className={`relative border-r border-gray-300 ${
                        booked ? '' : 'cursor-pointer hover:bg-blue-50'
                      } ${isSelected && showLongPressIndicator ? 'bg-blue-100' : ''}`}
                      onClick={() => !booked && handleSlotClick(date, timeSlot)}
                      onTouchStart={() => handleTouchStart(date, timeSlot)}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                      onMouseDown={() => handleTouchStart(date, timeSlot)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >
                      {/* 予約表示 */}
                      {renderAppointment(date, timeSlot)}
                      
                      {/* 長押しインジケーター */}
                      {isSelected && showLongPressIndicator && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-70 z-20">
                          <div className="text-xs font-medium text-blue-800">
                            予約作成中...
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* 設定パネル */}
      {showSettings && (
        <CalendarSettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentSettings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
}