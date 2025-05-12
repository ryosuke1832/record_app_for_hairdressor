// src/components/AppointmentStatusBadge.tsx
import React from 'react';

type AppointmentStatusBadgeProps = {
  status: 'scheduled' | 'completed' | 'cancelled';
  className?: string;
};

export default function AppointmentStatusBadge({ 
  status, 
  className = '' 
}: AppointmentStatusBadgeProps) {
  // ステータスに応じたバッジカラーを設定
  const getStatusBadgeClass = () => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ステータスの日本語表示
  const getStatusText = () => {
    switch (status) {
      case 'scheduled':
        return '予約済み';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()} ${className}`}>
      {getStatusText()}
    </span>
  );
}