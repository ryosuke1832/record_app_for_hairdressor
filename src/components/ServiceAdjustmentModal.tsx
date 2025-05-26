// src/components/ServiceAdjustmentModal.tsx
import React, { useState, useEffect } from 'react';
import { AdjustableService, ServiceAdjustmentModalProps } from '@/types/appointment';

const ServiceAdjustmentModal = ({ 
  serviceId, 
  service, 
  onSave, 
  onClose, 
  onReset 
}: ServiceAdjustmentModalProps) => {
  const [adjustedDuration, setAdjustedDuration] = useState(service.adjustedDuration);
  const [adjustedPrice, setAdjustedPrice] = useState(service.adjustedPrice);
  const [reason, setReason] = useState(service.adjustmentReason || '');

  // プリセット調整値
  const durationPresets = [
    { label: '-15分', value: -15 },
    { label: '-10分', value: -10 },
    { label: '-5分', value: -5 },
    { label: '+5分', value: 5 },
    { label: '+10分', value: 10 },
    { label: '+15分', value: 15 },
    { label: '+30分', value: 30 },
  ];

  const pricePresets = [
    { label: '-20%', value: -0.2, type: 'percentage' },
    { label: '-10%', value: -0.1, type: 'percentage' },
    { label: '-500円', value: -500, type: 'fixed' },
    { label: '+500円', value: 500, type: 'fixed' },
    { label: '+10%', value: 0.1, type: 'percentage' },
    { label: '+20%', value: 0.2, type: 'percentage' },
  ];

  const commonReasons = [
    '初回来店のため',
    'VIP顧客のため',
    '髪質に合わせて時間延長',
    '特別な技術が必要',
    'リピーター特典',
    'シニア割引',
    '学生割引',
    '紹介割引',
  ];

  const handleDurationPreset = (value: number) => {
    const newDuration = Math.max(5, service.baseDuration + value);
    setAdjustedDuration(newDuration);
  };

  const handlePricePreset = (preset: any) => {
    let newPrice: number;
    if (preset.type === 'percentage') {
      newPrice = Math.round(service.basePrice * (1 + preset.value));
    } else {
      newPrice = service.basePrice + preset.value;
    }
    setAdjustedPrice(Math.max(0, newPrice));
  };

  const handleSave = () => {
    onSave(serviceId, adjustedDuration, adjustedPrice, reason);
    onClose();
  };

  const handleReset = () => {
    setAdjustedDuration(service.baseDuration);
    setAdjustedPrice(service.basePrice);
    setReason('');
    onReset(serviceId);
  };

  const isChanged = adjustedDuration !== service.baseDuration || adjustedPrice !== service.basePrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">サービス調整: {service.name}</h3>
        
        {/* 現在の設定表示 */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">標準設定</div>
            <div className="font-medium">{service.basePrice.toLocaleString()}円</div>
            <div className="text-gray-600">{service.baseDuration}分</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">調整後</div>
            <div className={`font-medium ${isChanged ? 'text-blue-600' : ''}`}>
              {adjustedPrice.toLocaleString()}円
              {adjustedPrice !== service.basePrice && (
                <span className="text-xs ml-1">
                  ({adjustedPrice > service.basePrice ? '+' : ''}
                  {(adjustedPrice - service.basePrice).toLocaleString()})
                </span>
              )}
            </div>
            <div className={`text-gray-600 ${isChanged ? 'text-blue-600' : ''}`}>
              {adjustedDuration}分
              {adjustedDuration !== service.baseDuration && (
                <span className="text-xs ml-1">
                  ({adjustedDuration > service.baseDuration ? '+' : ''}
                  {adjustedDuration - service.baseDuration}分)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 時間調整 */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">⏰ 時間調整</h4>
          
          {/* プリセットボタン */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
            {durationPresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleDurationPreset(preset.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {/* 直接入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              調整後の時間（分）
            </label>
            <input
              type="number"
              value={adjustedDuration}
              onChange={(e) => setAdjustedDuration(Math.max(5, parseInt(e.target.value) || 5))}
              min="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 料金調整 */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">💰 料金調整</h4>
          
          {/* プリセットボタン */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {pricePresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePricePreset(preset)}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          {/* 直接入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              調整後の料金（円）
            </label>
            <input
              type="number"
              value={adjustedPrice}
              onChange={(e) => setAdjustedPrice(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 調整理由 */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3">📝 調整理由</h4>
          
          {/* よく使う理由 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {commonReasons.map((reasonText, index) => (
              <button
                key={index}
                onClick={() => setReason(reasonText)}
                className={`px-2 py-1 text-sm border rounded hover:bg-gray-50 ${
                  reason === reasonText ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {reasonText}
              </button>
            ))}
          </div>
          
          {/* 自由入力 */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="調整理由を入力してください"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            標準に戻す
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
              調整を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAdjustmentModal;