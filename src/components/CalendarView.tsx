// src/components/CalendarView.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 時間設定（変数として定義）
const START_HOUR = 8; // 開始時間（8時）
const END_HOUR = 20;  // 終了時間（20時）

// 曜日の表示用配列
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

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

  // 週の日付を生成
  useEffect(() => {
    const dates = [];
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 日曜始まり

    for (let i = 0; i < 7; i++) {
      dates.push(addDays(weekStart, i));
    }
    
    setWeekDates(dates);
  }, [currentDate]);

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

  // 時間枠を生成
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      slots.push(hour);
    }
    return slots;
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
  const renderAppointment = (date: Date, hour: number) => {
    return appointments.filter(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentHour = appointmentStart.getHours();
      return isSameDay(appointmentStart, date) && appointmentHour === hour;
    }).map(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentEnd = parseISO(appointment.end);
      
      return (
        <div 
          key={appointment.id}
          className={`${getAppointmentColor(appointment.status)} text-white rounded p-1 text-xs cursor-pointer hover:opacity-90`}
          style={{
            height: `${(appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60 * 30) * 24}px`,
            marginTop: `${(appointmentStart.getMinutes() / 60) * 48}px`
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleAppointmentClick(appointment.id);
          }}
        >
          <div className="font-bold">{appointment.title}</div>
          <div>{appointment.clientName}</div>
          <div>
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
  const isSlotBooked = (date: Date, hour: number) => {
    return appointments.some(appointment => {
      const appointmentStart = parseISO(appointment.start);
      const appointmentEnd = parseISO(appointment.end);
      const appointmentHour = appointmentStart.getHours();
      const appointmentEndHour = appointmentEnd.getHours();
      const appointmentEndMinutes = appointmentEnd.getMinutes();
      
      const effectiveEndHour = appointmentEndMinutes === 0 ? appointmentEndHour - 1 : appointmentEndHour;
      
      return isSameDay(appointmentStart, date) && 
             (hour >= appointmentHour && hour <= effectiveEndHour);
    });
  };

  // 空きスロットをタップ/クリックした時の処理
  const handleSlotClick = (date: Date, hour: number) => {
    if (isSlotBooked(date, hour)) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
    
    router.push(`/appointments/new?date=${formattedDate}&time=${formattedTime}`);
  };

  // タイムスロットを長押しした時の処理（モバイル対応）
  const handleTouchStart = (date: Date, hour: number) => {
    if (isSlotBooked(date, hour)) return;

    setSelectedSlot({ date, hour });
    
    const timer = setTimeout(() => {
      setShowLongPressIndicator(true);
      
      setTimeout(() => {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
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
          <button className="border border-gray-300 px-4 py-1 rounded text-sm flex-1 sm:flex-none">
            表示設定
          </button>
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
          <div className="grid grid-cols-8 border-b border-gray-300 bg-gray-100">
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
          {getTimeSlots().map((hour, index) => (
            <div 
              key={index} 
              className="grid grid-cols-8 border-b border-gray-300"
            >
              {/* 時間表示 */}
              <div className="p-2 text-right text-xs text-gray-500 border-r border-gray-300">
                {`${hour}:00`}
              </div>
              
              {/* 各曜日の時間枠 */}
              {weekDates.map((date, dateIndex) => {
                const booked = isSlotBooked(date, hour);
                const isSelected = selectedSlot && 
                                  isSameDay(selectedSlot.date, date) && 
                                  selectedSlot.hour === hour;
                
                return (
                  <div 
                    key={dateIndex} 
                    className={`relative h-12 border-r border-gray-300 ${
                      booked ? '' : 'cursor-pointer hover:bg-blue-50'
                    } ${isSelected && showLongPressIndicator ? 'bg-blue-100' : ''}`}
                    onClick={() => !booked && handleSlotClick(date, hour)}
                    onTouchStart={() => handleTouchStart(date, hour)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(date, hour)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                  >
                    {/* 30分区切りの薄い境界線 */}
                    <div className="absolute w-full h-px bg-gray-200 top-1/2"></div>
                    
                    {/* 予約表示 */}
                    <div className="relative h-full">
                      {renderAppointment(date, hour)}
                    </div>
                    
                    {/* 長押しインジケーター */}
                    {isSelected && showLongPressIndicator && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-70">
                        <div className="text-xs font-medium text-blue-800">
                          予約作成中...
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}