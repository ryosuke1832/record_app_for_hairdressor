import React, { useState, useEffect } from 'react';

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

type CalendarSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_INTERVALS = [
  { value: 15, label: '15分間隔' },
  { value: 30, label: '30分間隔' },
  { value: 60, label: '1時間間隔' }
];

export default function CalendarSettingsPanel({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSettingsChange 
}: CalendarSettingsProps) {
  const [settings, setSettings] = useState<CalendarSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'time' | 'days'>('time');

  // 現在の設定を更新
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  // 設定変更ハンドラ
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = key.split('.');
      
      if (keys.length === 2) {
        (newSettings as any)[keys[0]][keys[1]] = value;
      } else {
        (newSettings as any)[key] = value;
      }
      
      return newSettings;
    });
  };

  // 設定を保存
  const handleSave = () => {
    // バリデーション
    if (settings.timeRange.startHour >= settings.timeRange.endHour) {
      alert('開始時間は終了時間より前である必要があります');
      return;
    }

    if (settings.dayRange.startDay > settings.dayRange.endDay && settings.showWeekends) {
      alert('開始曜日は終了曜日より前である必要があります');
      return;
    }

    onSettingsChange(settings);
    onClose();
  };

  // リセット
  const handleReset = () => {
    const defaultSettings: CalendarSettings = {
      timeRange: { startHour: 8, endHour: 20 },
      dayRange: { startDay: 0, endDay: 6 },
      timeSlotInterval: 30,
      showWeekends: true
    };
    setSettings(defaultSettings);
  };

  // プリセット設定
  const applyPreset = (preset: string) => {
    const presets: { [key: string]: Partial<CalendarSettings> } = {
      business: {
        timeRange: { startHour: 9, endHour: 18 },
        dayRange: { startDay: 1, endDay: 5 },
        showWeekends: false,
        timeSlotInterval: 30
      },
      extended: {
        timeRange: { startHour: 8, endHour: 21 },
        dayRange: { startDay: 0, endDay: 6 },
        showWeekends: true,
        timeSlotInterval: 30
      },
      weekend: {
        timeRange: { startHour: 10, endHour: 17 },
        dayRange: { startDay: 0, endDay: 6 },
        showWeekends: true,
        timeSlotInterval: 60
      }
    };

    if (presets[preset]) {
      setSettings(prev => ({ ...prev, ...presets[preset] }));
    }
  };

  // 時間選択肢の生成
  const generateHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => (
      <option key={i} value={i}>
        {i.toString().padStart(2, '0')}:00
      </option>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">カレンダー表示設定</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* タブナビゲーション */}
          <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'time'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              時間設定
            </button>
            <button
              onClick={() => setActiveTab('days')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'days'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              曜日設定
            </button>
          </div>
        </div>

        {/* 設定内容 */}
        <div className="p-6">
          {/* プリセット */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">プリセット設定</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => applyPreset('business')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">平日営業</div>
                <div className="text-sm text-gray-500">月-金 9:00-18:00</div>
              </button>
              <button
                onClick={() => applyPreset('extended')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">拡張営業</div>
                <div className="text-sm text-gray-500">毎日 8:00-21:00</div>
              </button>
              <button
                onClick={() => applyPreset('weekend')}
                className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">週末営業</div>
                <div className="text-sm text-gray-500">毎日 10:00-17:00</div>
              </button>
            </div>
          </div>

          {/* 時間設定タブ */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">⏰ 営業時間設定</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      開始時間
                    </label>
                    <select
                      value={settings.timeRange.startHour}
                      onChange={(e) => handleSettingChange('timeRange.startHour', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {generateHourOptions()}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      終了時間
                    </label>
                    <select
                      value={settings.timeRange.endHour}
                      onChange={(e) => handleSettingChange('timeRange.endHour', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {generateHourOptions()}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    時間間隔
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_INTERVALS.map(interval => (
                      <button
                        key={interval.value}
                        onClick={() => handleSettingChange('timeSlotInterval', interval.value)}
                        className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                          settings.timeSlotInterval === interval.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {interval.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* プレビュー */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">プレビュー</h4>
                <div className="text-sm text-gray-600">
                  営業時間: {settings.timeRange.startHour.toString().padStart(2, '0')}:00 
                  - {settings.timeRange.endHour.toString().padStart(2, '0')}:00
                  <br />
                  時間間隔: {settings.timeSlotInterval}分
                  <br />
                  表示時間枠: {Math.ceil((settings.timeRange.endHour - settings.timeRange.startHour) * 60 / settings.timeSlotInterval)}個
                </div>
              </div>
            </div>
          )}

          {/* 曜日設定タブ */}
          {activeTab === 'days' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">📅 表示曜日設定</h3>
                
                <div className="mb-6">
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={settings.showWeekends}
                      onChange={(e) => handleSettingChange('showWeekends', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      土日を表示する
                    </span>
                  </label>
                </div>

                {settings.showWeekends && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        開始曜日
                      </label>
                      <select
                        value={settings.dayRange.startDay}
                        onChange={(e) => handleSettingChange('dayRange.startDay', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {WEEKDAYS.map((day, index) => (
                          <option key={index} value={index}>
                            {day}曜日
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        終了曜日
                      </label>
                      <select
                        value={settings.dayRange.endDay}
                        onChange={(e) => handleSettingChange('dayRange.endDay', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {WEEKDAYS.map((day, index) => (
                          <option key={index} value={index}>
                            {day}曜日
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 曜日プリセット */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    よく使う設定
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        handleSettingChange('dayRange.startDay', 1);
                        handleSettingChange('dayRange.endDay', 5);
                        handleSettingChange('showWeekends', false);
                      }}
                      className="p-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      平日のみ
                    </button>
                    <button
                      onClick={() => {
                        handleSettingChange('dayRange.startDay', 0);
                        handleSettingChange('dayRange.endDay', 6);
                        handleSettingChange('showWeekends', true);
                      }}
                      className="p-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      全曜日
                    </button>
                    <button
                      onClick={() => {
                        handleSettingChange('dayRange.startDay', 0);
                        handleSettingChange('dayRange.endDay', 6);
                        handleSettingChange('showWeekends', true);
                      }}
                      className="p-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      週末含む
                    </button>
                  </div>
                </div>
              </div>

              {/* プレビュー */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">プレビュー</h4>
                <div className="text-sm text-gray-600">
                  {settings.showWeekends ? (
                    <>
                      表示曜日: {WEEKDAYS[settings.dayRange.startDay]} - {WEEKDAYS[settings.dayRange.endDay]}
                      <br />
                      表示列数: {settings.dayRange.endDay - settings.dayRange.startDay + 1}列
                    </>
                  ) : (
                    <>
                      表示曜日: 平日のみ（月-金）
                      <br />
                      表示列数: 5列
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            リセット
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}