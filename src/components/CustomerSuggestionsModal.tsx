// src/components/CustomerSuggestionsModal.tsx
import React, { useState, useEffect } from 'react';
import { AdjustableService, HistoricalAdjustment, CustomerSuggestionsProps } from '@/types/appointment';

const CustomerSuggestionsModal = ({ 
  customerId, 
  selectedServices, 
  onApplySuggestions, 
  onClose 
}: CustomerSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<HistoricalAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // 顧客の過去の調整履歴を取得
  useEffect(() => {
    const fetchCustomerHistory = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}/history`);
        if (response.ok) {
          const history = await response.json();
          const historicalAdjustments = analyzeAdjustmentHistory(history);
          setSuggestions(historicalAdjustments);
        }
      } catch (error) {
        console.error('履歴の取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerHistory();
  }, [customerId]);

  // 過去の調整履歴を分析
  const analyzeAdjustmentHistory = (appointments: any[]): HistoricalAdjustment[] => {
    const serviceAdjustments: { [serviceId: string]: any[] } = {};
    
    // 完了した予約のみを対象
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    completedAppointments.forEach(appointment => {
      appointment.services.forEach((service: any) => {
        if (!serviceAdjustments[service.id]) {
          serviceAdjustments[service.id] = [];
        }
        serviceAdjustments[service.id].push({
          duration: service.duration,
          price: service.price,
          date: appointment.start
        });
      });
    });

    // 選択されたサービスのみの履歴を返す
    return selectedServices.map(selectedService => {
      const history = serviceAdjustments[selectedService.id] || [];
      
      if (history.length === 0) return null;
      
      const averageDuration = Math.round(
        history.reduce((sum, h) => sum + h.duration, 0) / history.length
      );
      const averagePrice = Math.round(
        history.reduce((sum, h) => sum + h.price, 0) / history.length
      );
      
      // 最新の調整値
      const latest = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      return {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        averageDuration,
        averagePrice,
        lastDuration: latest.duration,
        lastPrice: latest.price,
        frequency: history.length,
        baseDuration: selectedService.baseDuration,
        basePrice: selectedService.basePrice
      };
    }).filter(Boolean) as HistoricalAdjustment[];
  };

  // 提案の選択/選択解除
  const toggleSuggestion = (serviceId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // 全選択/全解除
  const toggleAllSuggestions = () => {
    if (selectedSuggestions.length === suggestions.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions(suggestions.map(s => s.serviceId));
    }
  };

  // 提案を適用
  const applySuggestions = (useAverage: boolean = false) => {
    const updatedServices = selectedServices.map(service => {
      const suggestion = suggestions.find(s => s.serviceId === service.id);
      
      if (suggestion && selectedSuggestions.includes(service.id)) {
        return {
          ...service,
          adjustedDuration: useAverage ? suggestion.averageDuration : suggestion.lastDuration,
          adjustedPrice: useAverage ? suggestion.averagePrice : suggestion.lastPrice,
          isAdjusted: true,
          adjustmentReason: useAverage 
            ? `過去の平均値 (${suggestion.frequency}回の実績)` 
            : '前回と同じ設定'
        };
      }
      
      return service;
    });

    onApplySuggestions(updatedServices);
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">履歴を読み込み中...</div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">履歴データなし</h3>
          <p className="text-gray-600 mb-4">
            この顧客の過去の調整履歴が見つかりませんでした。
            初回来店または標準料金での利用のみのようです。
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">過去の実績による提案</h3>
        
        {/* ヘッダーアクション */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={toggleAllSuggestions}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedSuggestions.length === suggestions.length ? '全て解除' : '全て選択'}
          </button>
          
          <div className="text-sm text-gray-500">
            {suggestions.length}個の提案があります
          </div>
        </div>

        {/* 提案一覧 */}
        <div className="space-y-4 mb-6">
          {suggestions.map(suggestion => {
            const isSelected = selectedSuggestions.includes(suggestion.serviceId);
            const hasAdjustment = suggestion.averageDuration !== suggestion.baseDuration || 
                                suggestion.averagePrice !== suggestion.basePrice;
            
            return (
              <div 
                key={suggestion.serviceId}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => toggleSuggestion(suggestion.serviceId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{suggestion.serviceName}</h4>
                  <div className="flex items-center">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-2">
                      {suggestion.frequency}回の実績
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSuggestion(suggestion.serviceId)}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                </div>
                
                {hasAdjustment && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {/* 標準設定 */}
                    <div className="text-center p-2 bg-gray-100 rounded">
                      <div className="text-gray-500 text-xs mb-1">標準設定</div>
                      <div className="font-medium">
                        {suggestion.basePrice.toLocaleString()}円
                      </div>
                      <div className="text-gray-600">
                        {suggestion.baseDuration}分
                      </div>
                    </div>
                    
                    {/* 前回の設定 */}
                    <div className="text-center p-2 bg-blue-100 rounded">
                      <div className="text-blue-600 text-xs mb-1">前回の設定</div>
                      <div className="font-medium text-blue-800">
                        {suggestion.lastPrice.toLocaleString()}円
                        {suggestion.lastPrice !== suggestion.basePrice && (
                          <span className="text-xs ml-1">
                            ({suggestion.lastPrice > suggestion.basePrice ? '+' : ''}
                            {(suggestion.lastPrice - suggestion.basePrice).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className="text-blue-700">
                        {suggestion.lastDuration}分
                        {suggestion.lastDuration !== suggestion.baseDuration && (
                          <span className="text-xs ml-1">
                            ({suggestion.lastDuration > suggestion.baseDuration ? '+' : ''}
                            {suggestion.lastDuration - suggestion.baseDuration}分)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 平均設定 */}
                    <div className="text-center p-2 bg-green-100 rounded">
                      <div className="text-green-600 text-xs mb-1">平均設定</div>
                      <div className="font-medium text-green-800">
                        {suggestion.averagePrice.toLocaleString()}円
                        {suggestion.averagePrice !== suggestion.basePrice && (
                          <span className="text-xs ml-1">
                            ({suggestion.averagePrice > suggestion.basePrice ? '+' : ''}
                            {(suggestion.averagePrice - suggestion.basePrice).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className="text-green-700">
                        {suggestion.averageDuration}分
                        {suggestion.averageDuration !== suggestion.baseDuration && (
                          <span className="text-xs ml-1">
                            ({suggestion.averageDuration > suggestion.baseDuration ? '+' : ''}
                            {suggestion.averageDuration - suggestion.baseDuration}分)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {!hasAdjustment && (
                  <div className="text-sm text-gray-500">
                    この顧客は標準設定で利用されています
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          
          {selectedSuggestions.length > 0 && (
            <>
              <button
                onClick={() => applySuggestions(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                前回と同じ設定を適用
              </button>
              <button
                onClick={() => applySuggestions(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                平均設定を適用
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSuggestionsModal;