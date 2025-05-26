// src/components/BulkAdjustmentModal.tsx
import React, { useState } from 'react';
import { AdjustableService, BulkAdjustmentProps } from '@/types/appointment';

const BulkAdjustmentModal = ({ selectedServices, onBulkAdjustment, onClose }: BulkAdjustmentProps) => {
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed' | 'time'>('percentage');
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [timeAdjustment, setTimeAdjustment] = useState(0);
  const [reason, setReason] = useState('');

  // プリセット設定
  const presets = [
    { name: '初回割引 (20%OFF)', type: 'percentage', price: -20, time: 0, reason: '初回来店割引' },
    { name: 'VIP割引 (15%OFF)', type: 'percentage', price: -15, time: 0, reason: 'VIP顧客割引' },
    { name: '初回サービス (+10分)', type: 'time', price: 0, time: 10, reason: '初回のため時間延長' },
    { name: 'リピーター特典 (10%OFF)', type: 'percentage', price: -10, time: 0, reason: 'リピーター特典' },
    { name: 'シニア割引 (10%OFF)', type: 'percentage', price: -10, time: 0, reason: 'シニア割引' },
  ];

  const handlePresetClick = (preset: any) => {
    setAdjustmentType(preset.type);
    setPriceAdjustment(preset.price);
    setTimeAdjustment(preset.time);
    setReason(preset.reason);
  };

  const handleApply = () => {
    const adjustedServices = selectedServices.map(service => {
      let newPrice = service.basePrice;
      let newDuration = service.baseDuration;

      // 料金調整
      if (adjustmentType === 'percentage') {
        newPrice = Math.round(service.basePrice * (1 + priceAdjustment / 100));
      } else if (adjustmentType === 'fixed') {
        newPrice = Math.max(0, service.basePrice + priceAdjustment);
      }

      // 時間調整
      if (timeAdjustment !== 0) {
        newDuration = Math.max(5, service.baseDuration + timeAdjustment);
      }

      return {
        ...service,
        adjustedPrice: newPrice,
        adjustedDuration: newDuration,
        isAdjusted: newPrice !== service.basePrice || newDuration !== service.baseDuration,
        adjustmentReason: reason
      };
    });

    onBulkAdjustment(adjustedServices);
    onClose();
  };

  const calculatePreview = () => {
    const originalTotal = selectedServices.reduce((sum, s) => sum + s.basePrice, 0);
    const originalDuration = selectedServices.reduce((sum, s) => sum + s.baseDuration, 0);
    
    let newTotal = 0;
    let newDuration = 0;
    
    selectedServices.forEach(service => {
      let price = service.basePrice;
      let duration = service.baseDuration;
      
      if (adjustmentType === 'percentage') {
        price = Math.round(price * (1 + priceAdjustment / 100));
      } else if (adjustmentType === 'fixed') {
        price = Math.max(0, price + priceAdjustment);
      }
      
      duration = Math.max(5, duration + timeAdjustment);
      
      newTotal += price;
      newDuration += duration;
    });

    return { originalTotal, originalDuration, newTotal, newDuration };
  };

  const preview = calculatePreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">一括調整</h3>
        
        {/* プリセット */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">よく使う設定</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(preset)}
                className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-gray-500 text-xs">{preset.reason}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 調整タイプ選択 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">調整方法</h4>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setAdjustmentType('percentage')}
              className={`p-3 border rounded-lg text-sm ${
                adjustmentType === 'percentage' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              パーセント調整
            </button>
            <button
              onClick={() => setAdjustmentType('fixed')}
              className={`p-3 border rounded-lg text-sm ${
                adjustmentType === 'fixed' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              固定金額調整
            </button>
            <button
              onClick={() => setAdjustmentType('time')}
              className={`p-3 border rounded-lg text-sm ${
                adjustmentType === 'time' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              時間のみ調整
            </button>
          </div>
        </div>

        {/* 調整値入力 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {adjustmentType !== 'time' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                料金調整
                {adjustmentType === 'percentage' ? ' (%)' : ' (円)'}
              </label>
              <input
                type="number"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={adjustmentType === 'percentage' ? "-20 (20%OFF)" : "-500 (500円引き)"}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              時間調整 (分)
            </label>
            <input
              type="number"
              value={timeAdjustment}
              onChange={(e) => setTimeAdjustment(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+10 (10分延長)"
            />
          </div>
        </div>

        {/* 理由入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            調整理由
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 初回来店のため、VIP顧客のため"
          />
        </div>

        {/* プレビュー */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">調整プレビュー</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">調整前</div>
              <div className="font-medium">
                料金: {preview.originalTotal.toLocaleString()}円
              </div>
              <div className="font-medium">
                時間: {preview.originalDuration}分
              </div>
            </div>
            <div>
              <div className="text-gray-500">調整後</div>
              <div className={`font-medium ${
                preview.newTotal !== preview.originalTotal ? 'text-blue-600' : ''
              }`}>
                料金: {preview.newTotal.toLocaleString()}円
                {preview.newTotal !== preview.originalTotal && (
                  <span className="text-xs ml-1">
                    ({preview.newTotal > preview.originalTotal ? '+' : ''}
                    {(preview.newTotal - preview.originalTotal).toLocaleString()}円)
                  </span>
                )}
              </div>
              <div className={`font-medium ${
                preview.newDuration !== preview.originalDuration ? 'text-blue-600' : ''
              }`}>
                時間: {preview.newDuration}分
                {preview.newDuration !== preview.originalDuration && (
                  <span className="text-xs ml-1">
                    ({preview.newDuration > preview.originalDuration ? '+' : ''}
                    {preview.newDuration - preview.originalDuration}分)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 対象サービス一覧 */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">調整対象サービス</h4>
          <div className="space-y-2">
            {selectedServices.map(service => (
              <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{service.name}</span>
                <div className="text-sm text-gray-500">
                  {service.basePrice.toLocaleString()}円 / {service.baseDuration}分
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            一括調整を適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAdjustmentModal;