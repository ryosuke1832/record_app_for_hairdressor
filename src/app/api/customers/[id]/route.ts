// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CUSTOMERS_FILE_PATH = path.join(process.cwd(), 'data', 'customers.json');
const APPOINTMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'appointments.json');

// 顧客データの型定義
type Customer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  totalVisits: number;
  lastVisit?: string;
  totalSpent: number;
  averageSpent: number;
  preferences?: {
    hairType?: string;
    favoriteServices?: string[];
    allergyInfo?: string;
    skinType?: string;
  };
};

type CustomersData = {
  customers: Customer[];
};

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
async function readCustomers(): Promise<CustomersData> {
  try {
    const data = await fs.readFile(CUSTOMERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('顧客データの読み込みエラー:', error);
    return { customers: [] };
  }
}

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
async function writeCustomers(data: CustomersData): Promise<void> {
  try {
    const dataDir = path.dirname(CUSTOMERS_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(CUSTOMERS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('顧客データの書き込みエラー:', error);
    throw error;
  }
}

// GET: 特定の顧客を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customersData = await readCustomers();
    const customer = customersData.customers.find(c => c.id === params.id);
    
    if (!customer) {
      return NextResponse.json(
        { error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    // 顧客の予約履歴を取得
    const appointmentsData = await readAppointments();
    const customerAppointments = appointmentsData.appointments
      .filter(appointment => appointment.clientId === params.id)
      .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // 新しい順

    // 統計情報を計算
    const completedAppointments = customerAppointments.filter(a => a.status === 'completed');
    const totalSpent = completedAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const totalVisits = completedAppointments.length;
    const averageSpent = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;
    
    // 最終来店日
    const lastCompletedAppointment = completedAppointments[0];
    const lastVisit = lastCompletedAppointment ? lastCompletedAppointment.start : undefined;

    // よく利用するサービスを分析
    const serviceCount: { [key: string]: number } = {};
    completedAppointments.forEach(appointment => {
      appointment.services.forEach(service => {
        serviceCount[service.name] = (serviceCount[service.name] || 0) + 1;
      });
    });
    
    const favoriteServices = Object.entries(serviceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service]) => service);

    // 顧客データを更新された統計情報と共に返す
    const customerWithStats = {
      ...customer,
      totalSpent,
      totalVisits,
      averageSpent,
      lastVisit,
      preferences: {
        ...customer.preferences,
        favoriteServices
      },
      appointments: customerAppointments
    };

    return NextResponse.json(customerWithStats);
  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    return NextResponse.json(
      { error: '顧客データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: 顧客の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedData = await request.json();
    const data = await readCustomers();
    
    const customerIndex = data.customers.findIndex(c => c.id === params.id);
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    // 既存の顧客データを更新
    const existingCustomer = data.customers[customerIndex];
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...updatedData,
      id: params.id, // IDは変更不可
      updatedAt: new Date().toISOString()
    };

    data.customers[customerIndex] = updatedCustomer;
    
    await writeCustomers(data);

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('顧客更新エラー:', error);
    return NextResponse.json(
      { error: '顧客の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: 顧客の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readCustomers();
    
    const customerIndex = data.customers.findIndex(c => c.id === params.id);
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    // 顧客を削除
    const deletedCustomer = data.customers.splice(customerIndex, 1)[0];
    
    await writeCustomers(data);

    return NextResponse.json(deletedCustomer);
  } catch (error) {
    console.error('顧客削除エラー:', error);
    return NextResponse.json(
      { error: '顧客の削除に失敗しました' },
      { status: 500 }
    );
  }
}