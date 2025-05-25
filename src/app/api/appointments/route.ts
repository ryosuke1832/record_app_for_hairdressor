// src/app/api/appointments/route.ts
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
    // ファイルが存在しない場合は空のデータを返す
    return { appointments: [] };
  }
}

// JSONファイルの書き込み
async function writeAppointments(data: AppointmentsData): Promise<void> {
  try {
    // dataディレクトリが存在しない場合は作成
    const dataDir = path.dirname(APPOINTMENTS_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(APPOINTMENTS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('予約データの書き込みエラー:', error);
    throw error;
  }
}

// GET: 全予約の取得
export async function GET() {
  try {
    const data = await readAppointments();
    return NextResponse.json(data.appointments);
  } catch (error) {
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規予約の作成
export async function POST(request: NextRequest) {
  try {
    const newAppointment = await request.json();
    
    // バリデーション
    if (!newAppointment.clientName || !newAppointment.start || !newAppointment.services?.length) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const data = await readAppointments();
    
    // 新しいIDを生成（既存のIDの最大値 + 1）
    const maxId = data.appointments.reduce((max, appointment) => 
      Math.max(max, parseInt(appointment.id) || 0), 0
    );
    const newId = (maxId + 1).toString();

    // 新しい予約データを作成
    const appointment: Appointment = {
      id: newId,
      title: newAppointment.title || newAppointment.services.map((s: Service) => s.name).join(' & '),
      start: newAppointment.start,
      end: newAppointment.end,
      clientId: newAppointment.clientId || newId, // 暫定的にIDと同じ値を使用
      clientName: newAppointment.clientName,
      phone: newAppointment.phone || '',
      services: newAppointment.services,
      totalPrice: newAppointment.totalPrice || 0,
      totalDuration: newAppointment.totalDuration || 0,
      note: newAppointment.note || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // データに追加
    data.appointments.push(appointment);
    
    // ファイルに保存
    await writeAppointments(data);

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('予約作成エラー:', error);
    return NextResponse.json(
      { error: '予約の作成に失敗しました' },
      { status: 500 }
    );
  }
}