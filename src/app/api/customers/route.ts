// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CUSTOMERS_FILE_PATH = path.join(process.cwd(), 'data', 'customers.json');

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

// JSONファイルの読み込み
async function readCustomers(): Promise<CustomersData> {
  try {
    const data = await fs.readFile(CUSTOMERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('顧客データの読み込みエラー:', error);
    // ファイルが存在しない場合は空のデータを返す
    return { customers: [] };
  }
}

// JSONファイルの書き込み
async function writeCustomers(data: CustomersData): Promise<void> {
  try {
    // dataディレクトリが存在しない場合は作成
    const dataDir = path.dirname(CUSTOMERS_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(CUSTOMERS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('顧客データの書き込みエラー:', error);
    throw error;
  }
}

// GET: 全顧客の取得
export async function GET(request: NextRequest) {
  try {
    const data = await readCustomers();
    
    // クエリパラメータで検索・フィルタリング
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    let filteredCustomers = data.customers;
    
    // 検索フィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.kana.toLowerCase().includes(searchLower) ||
        customer.phone.includes(search) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    }
    
    // ソート
    filteredCustomers.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'lastVisit':
          aValue = a.lastVisit ? new Date(a.lastVisit) : new Date(0);
          bValue = b.lastVisit ? new Date(b.lastVisit) : new Date(0);
          break;
        case 'totalVisits':
          aValue = a.totalVisits;
          bValue = b.totalVisits;
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    return NextResponse.json(filteredCustomers);
  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    return NextResponse.json(
      { error: '顧客データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規顧客の作成
export async function POST(request: NextRequest) {
  try {
    const newCustomer = await request.json();
    
    // バリデーション
    if (!newCustomer.name || !newCustomer.phone) {
      return NextResponse.json(
        { error: '名前と電話番号は必須項目です' },
        { status: 400 }
      );
    }

    const data = await readCustomers();
    
    // 電話番号の重複チェック
    const existingCustomer = data.customers.find(c => c.phone === newCustomer.phone);
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'この電話番号は既に登録されています' },
        { status: 400 }
      );
    }
    
    // 新しいIDを生成（既存のIDの最大値 + 1）
    const maxId = data.customers.reduce((max, customer) => 
      Math.max(max, parseInt(customer.id) || 0), 0
    );
    const newId = (maxId + 1).toString();

    // 新しい顧客データを作成
    const customer: Customer = {
      id: newId,
      name: newCustomer.name,
      kana: newCustomer.kana || '',
      phone: newCustomer.phone,
      email: newCustomer.email || '',
      birthday: newCustomer.birthday || '',
      gender: newCustomer.gender || undefined,
      address: newCustomer.address || '',
      memo: newCustomer.memo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalVisits: 0,
      lastVisit: undefined,
      totalSpent: 0,
      averageSpent: 0,
      preferences: newCustomer.preferences || {}
    };

    // データに追加
    data.customers.push(customer);
    
    // ファイルに保存
    await writeCustomers(data);

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('顧客作成エラー:', error);
    return NextResponse.json(
      { error: '顧客の作成に失敗しました' },
      { status: 500 }
    );
  }
}