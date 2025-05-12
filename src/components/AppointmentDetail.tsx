// src/components/AppointmentDetail.tsx
import React from 'react';
import { format, parseISO } from 'date-fns';
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

type AppointmentDetailProps = {
  appointment: Appointment;
  onCancelAppointment: () => void;
  onCompleteAppointment: () => void;
};

export default function AppointmentDetail({ 
  appointment, 
  onCancelAppointment,
  onCompleteAppointment
}: AppointmentDetailProps) {
  // 予約ステータスに応じたバッジカラーを設定
  const getStatusBadgeClass = () => {
    switch (appointment.status) {
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
    switch (appointment.status) {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ステータスバナー */}
      <div className={`p-4 ${
        appointment.status === 'scheduled' ? 'bg-blue-50' :
        appointment.status === 'completed' ? 'bg-green-50' :
        'bg-red-50'
      }`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{appointment.title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* 予約日時 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">予約日時</h3>
          <div className="text-lg">
            {format(parseISO(appointment.start), 'yyyy年M月d日(E)', { locale: ja })}
          </div>
          <div className="text-lg">
            {format(parseISO(appointment.start), 'HH:mm')} 〜 {format(parseISO(appointment.end), 'HH:mm')}
          </div>
        </div>

        {/* 顧客情報 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">顧客情報</h3>
          <div className="text-lg font-medium">{appointment.clientName}</div>
          <div className="text-gray-600">{appointment.phone}</div>
        </div>

        {/* 施術内容 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">施術内容</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メニュー
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時間
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    料金
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointment.services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{service.duration}分</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{service.price.toLocaleString()}円</div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap" colSpan={2}>
                    <div className="text-sm font-medium text-gray-900">合計</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">{appointment.totalPrice.toLocaleString()}円</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 備考 */}
        {appointment.note && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">備考</h3>
            <div className="bg-gray-50 p-4 rounded-md text-gray-700">
              {appointment.note}
            </div>
          </div>
        )}

        {/* 操作ボタン - 予約済みステータスの場合のみ表示 */}
        {appointment.status === 'scheduled' && (
          <div className="mt-8 flex justify-end space-x-2 border-t pt-4">
            <button
              onClick={onCancelAppointment}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
            >
              予約をキャンセル
            </button>
            <button
              onClick={onCompleteAppointment}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              施術完了
            </button>
          </div>
        )}
      </div>
    </div>
  );
}