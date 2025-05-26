// src/app/api/customers/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const APPOINTMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'appointments.json');

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

type AppointmentsData = {
  appointments: Appointment[];
};

// JSONファイルの読み込み
async function readAppointments(): Promise<AppointmentsData> {
  try {
    const data = await fs.readFile(APPOINTMENTS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('予約データの読み込みエラー:', error);
    return { appointments: [] };
  }
}

// GET: 特定顧客の予約履歴を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readAppointments();
    
    // 指定された顧客の予約履歴を取得
    const customerAppointments = data.appointments
      .filter(appointment => appointment.clientId === params.id)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // 新しい順

    // クエリパラメータで完了済みのみまたは全てを指定可能
    const { searchParams } = new URL(request.url);
    const completedOnly = searchParams.get('completedOnly') === 'true';
    
    const filteredAppointments = completedOnly 
      ? customerAppointments.filter(apt => apt.status === 'completed')
      : customerAppointments;

    return NextResponse.json(filteredAppointments);
  } catch (error) {
    console.error('顧客履歴取得エラー:', error);
    return NextResponse.json(
      { error: '顧客履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 顧客の調整傾向を分析するエンドポイント
// GET /api/customers/[id]/history/analysis
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { serviceIds } = await request.json();
    const data = await readAppointments();
    
    // 指定された顧客の完了済み予約のみを対象
    const completedAppointments = data.appointments
      .filter(appointment => 
        appointment.clientId === params.id && 
        appointment.status === 'completed'
      )
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    // サービスごとの調整履歴を分析
    const serviceAnalysis: { [serviceId: string]: any } = {};
    
    completedAppointments.forEach(appointment => {
      appointment.services.forEach(service => {
        if (serviceIds.includes(service.id)) {
          if (!serviceAnalysis[service.id]) {
            serviceAnalysis[service.id] = {
              serviceId: service.id,
              serviceName: service.name,
              adjustments: [],
              totalUsage: 0
            };
          }
          
          serviceAnalysis[service.id].adjustments.push({
            duration: service.duration,
            price: service.price,
            appointmentDate: appointment.start,
            appointmentId: appointment.id
          });
          serviceAnalysis[service.id].totalUsage++;
        }
      });
    });

    // 統計データを計算
    const analysisResults = Object.values(serviceAnalysis).map((analysis: any) => {
      const adjustments = analysis.adjustments;
      
      if (adjustments.length === 0) return null;
      
      // 平均値計算
      const avgDuration = Math.round(
        adjustments.reduce((sum: number, adj: any) => sum + adj.duration, 0) / adjustments.length
      );
      const avgPrice = Math.round(
        adjustments.reduce((sum: number, adj: any) => sum + adj.price, 0) / adjustments.length
      );
      
      // 最頻値計算
      const durationFreq: { [key: number]: number } = {};
      const priceFreq: { [key: number]: number } = {};
      
      adjustments.forEach((adj: any) => {
        durationFreq[adj.duration] = (durationFreq[adj.duration] || 0) + 1;
        priceFreq[adj.price] = (priceFreq[adj.price] || 0) + 1;
      });
      
      const mostCommonDuration = Object.keys(durationFreq).reduce((a, b) => 
        durationFreq[parseInt(a)] > durationFreq[parseInt(b)] ? a : b
      );
      const mostCommonPrice = Object.keys(priceFreq).reduce((a, b) => 
        priceFreq[parseInt(a)] > priceFreq[parseInt(b)] ? a : b
      );
      
      // 最新の値
      const latest = adjustments[0]; // 既にソート済み
      
      // トレンド分析（直近3回の平均と全体平均の比較）
      const recent3 = adjustments.slice(0, 3);
      const recentAvgDuration = recent3.length > 0 ? 
        Math.round(recent3.reduce((sum: number, adj: any) => sum + adj.duration, 0) / recent3.length) : 0;
      const recentAvgPrice = recent3.length > 0 ? 
        Math.round(recent3.reduce((sum: number, adj: any) => sum + adj.price, 0) / recent3.length) : 0;
      
      return {
        serviceId: analysis.serviceId,
        serviceName: analysis.serviceName,
        totalUsage: analysis.totalUsage,
        averageDuration: avgDuration,
        averagePrice: avgPrice,
        mostCommonDuration: parseInt(mostCommonDuration),
        mostCommonPrice: parseInt(mostCommonPrice),
        latestDuration: latest.duration,
        latestPrice: latest.price,
        recentTrendDuration: recentAvgDuration,
        recentTrendPrice: recentAvgPrice,
        lastAppointmentDate: latest.appointmentDate,
        adjustmentHistory: adjustments.slice(0, 10) // 直近10回分
      };
    }).filter(Boolean);

    return NextResponse.json(analysisResults);
  } catch (error) {
    console.error('顧客分析エラー:', error);
    return NextResponse.json(
      { error: '顧客分析に失敗しました' },
      { status: 500 }
    );
  }
}