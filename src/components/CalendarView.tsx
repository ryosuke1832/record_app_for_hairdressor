// src/components/CalendarView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 時間設定（変数として定義）
const START_HOUR = 8; // 開始時間（8時）
const END_HOUR = 20;  // 終了時間（20時）

// 曜日の表示用配列
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// ダミーの予約データ
const dummyAppointments = [
  {
    id: '1',
    title: 'カット & カラー',
    start: new Date(2025, 4, 11, 10, 0), // 5月11日 10:00
    end: new Date(2025, 4, 11, 11, 30),  // 5月11日 11:30
    clientName: '田中 さくら',
    color: 'bg-blue-500'
  },
  {
    id: '2',
    title: 'パーマ',
    start: new Date(2025, 4, 12, 14, 0), // 5月12日 14:00
    end: new Date(2025, 4, 12, 16, 0),   // 5月12日 16:00
    clientName: '鈴木 健太',
    color: 'bg-green-500'
  },
  {
    id: '3',
    title: 'ヘッドスパ',
    start: new Date(2025, 4, 13, 11, 0), // 5月13日 11:00
    end: new Date(2025, 4, 13, 12, 0),   // 5月13日 12:00
    clientName: '伊藤 めぐみ',
    color: 'bg-purple-500'
  }
];

export default function CalendarView() {
  const router = useRouter(); // Next.jsのルータを使用
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
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

  // 予約を表示する関数
  const renderAppointment = (date: Date, hour: number) => {
    return dummyAppointments.filter(appointment => {
      const appointmentHour = appointment.start.getHours();
      return isSameDay(appointment.start, date) && appointmentHour === hour;
    }).map(appointment => (
      <div 
        key={appointment.id}
        className={`${appointment.color} text-white rounded p-1 text-xs cursor-pointer hover:opacity-90`}
        style={{
          height: `${(appointment.end.getTime() - appointment.start.getTime()) / (1000 * 60 * 30) * 24}px`,
          marginTop: `${(appointment.start.getMinutes() / 60) * 48}px`
        }}
        onClick={(e) => {
          e.stopPropagation(); // 親要素へのクリックイベント伝播を防止
          handleAppointmentClick(appointment.id);
        }}
      >
        <div className="font-bold">{appointment.title}</div>
        <div>{appointment.clientName}</div>
        <div>
          {format(appointment.start, 'HH:mm')} - {format(appointment.end, 'HH:mm')}
        </div>
      </div>
    ));
  };

  // 予約クリック時の処理 - 予約詳細ページへ遷移
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}`);
  };

  // タイムスロットが予約済みかどうかをチェック
  const isSlotBooked = (date: Date, hour: number) => {
    return dummyAppointments.some(appointment => {
      const appointmentHour = appointment.start.getHours();
      const appointmentEndHour = appointment.end.getHours();
      const appointmentEndMinutes = appointment.end.getMinutes();
      
      // 時間が0分の場合、終了時間は前の時間帯に含める
      const effectiveEndHour = appointmentEndMinutes === 0 ? appointmentEndHour - 1 : appointmentEndHour;
      
      return isSameDay(appointment.start, date) && 
             (hour >= appointmentHour && hour <= effectiveEndHour);
    });
  };

  // 空きスロットをタップ/クリックした時の処理
  const handleSlotClick = (date: Date, hour: number) => {
    // 予約済みのスロットは選択できないようにする
    if (isSlotBooked(date, hour)) return;

    // 予約作成画面へ遷移（選択した日付と時間をパラメータとして渡す）
    const formattedDate = format(date, 'yyyy-MM-dd');
    const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
    
    router.push(`/appointments/new?date=${formattedDate}&time=${formattedTime}`);
  };

  // タイムスロットを長押しした時の処理（モバイル対応）
  const handleTouchStart = (date: Date, hour: number) => {
    // 予約済みのスロットは選択できないようにする
    if (isSlotBooked(date, hour)) return;

    setSelectedSlot({ date, hour });
    
    // 長押しタイマーを設定（600ms）
    const timer = setTimeout(() => {
      setShowLongPressIndicator(true);
      
      // 1秒後に予約作成画面へ遷移
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
    // タイマーをクリア
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setSelectedSlot(null);
    setShowLongPressIndicator(false);
  };

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

      {/* カレンダーグリッド */}
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
    </div>
  );
}