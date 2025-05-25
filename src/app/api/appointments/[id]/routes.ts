// src/app/api/appointments/[id]/route.ts
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

// JSONファイルの書き込み
async function writeAppointments(data: AppointmentsData): Promise<void> {
  try {
    const dataDir = path.dirname(APPOINTMENTS_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(APPOINTMENTS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('予約データの書き込みエラー:', error);
    throw error;
  }
}

// GET: 特定の予約を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readAppointments();
    const appointment = data.appointments.find(appt => appt.id === params.id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: 予約の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedData = await request.json();
    const data = await readAppointments();
    
    const appointmentIndex = data.appointments.findIndex(appt => appt.id === params.id);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 既存の予約データを更新
    const existingAppointment = data.appointments[appointmentIndex];
    const updatedAppointment: Appointment = {
      ...existingAppointment,
      ...updatedData,
      id: params.id, // IDは変更不可
      updatedAt: new Date().toISOString()
    };

    data.appointments[appointmentIndex] = updatedAppointment;
    
    await writeAppointments(data);

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('予約更新エラー:', error);
    return NextResponse.json(
      { error: '予約の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: 予約の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readAppointments();
    
    const appointmentIndex = data.appointments.findIndex(appt => appt.id === params.id);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 予約を削除
    const deletedAppointment = data.appointments.splice(appointmentIndex, 1)[0];
    
    await writeAppointments(data);

    return NextResponse.json(deletedAppointment);
  } catch (error) {
    console.error('予約削除エラー:', error);
    return NextResponse.json(
      { error: '予約の削除に失敗しました' },
      { status: 500 }
    );
  }
}