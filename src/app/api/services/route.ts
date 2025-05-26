// src/app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SERVICES_FILE_PATH = path.join(process.cwd(), 'data', 'services.json');

// サービスデータの型定義
type Service = {
  id: string;
  name: string;
  duration: number; // 分
  price: number; // 円
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ServicesData = {
  services: Service[];
};

// JSONファイルの読み込み
async function readServices(): Promise<ServicesData> {
  try {
    const data = await fs.readFile(SERVICES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('サービスデータの読み込みエラー:', error);
    // ファイルが存在しない場合は初期データを返す
    return {
      services: [
        {
          id: "1",
          name: "カット",
          duration: 40,
          price: 4500,
          category: "基本メニュー",
          description: "カットのみ",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "2",
          name: "カラー",
          duration: 90,
          price: 8000,
          category: "カラーメニュー",
          description: "全体カラー",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "3",
          name: "パーマ",
          duration: 120,
          price: 12000,
          category: "パーマメニュー",
          description: "全体パーマ",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "4",
          name: "トリートメント",
          duration: 30,
          price: 3000,
          category: "ケアメニュー",
          description: "髪質改善トリートメント",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "5",
          name: "ヘッドスパ",
          duration: 40,
          price: 5000,
          category: "ケアメニュー",
          description: "リラクゼーション",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "6",
          name: "シャンプー・ブロー",
          duration: 20,
          price: 2000,
          category: "基本メニュー",
          description: "シャンプー・ブロー仕上げ",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
}

// JSONファイルの書き込み
async function writeServices(data: ServicesData): Promise<void> {
  try {
    // dataディレクトリが存在しない場合は作成
    const dataDir = path.dirname(SERVICES_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(SERVICES_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('サービスデータの書き込みエラー:', error);
    throw error;
  }
}

// GET: 全サービスの取得
export async function GET(request: NextRequest) {
  try {
    const data = await readServices();
    
    // クエリパラメータで検索・フィルタリング
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    
    let filteredServices = data.services;
    
    // 検索フィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower) ||
        (service.description && service.description.toLowerCase().includes(searchLower))
      );
    }
    
    // カテゴリフィルタリング
    if (category && category !== 'all') {
      filteredServices = filteredServices.filter(service => service.category === category);
    }
    
    // アクティブフィルタリング
    if (isActive !== null && isActive !== undefined) {
      const isActiveBoolean = isActive === 'true';
      filteredServices = filteredServices.filter(service => service.isActive === isActiveBoolean);
    }
    
    // 名前順でソート
    filteredServices.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json(filteredServices);
  } catch (error) {
    console.error('サービスデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'サービスデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 新規サービスの作成
export async function POST(request: NextRequest) {
  try {
    const newService = await request.json();
    
    // バリデーション
    if (!newService.name || !newService.duration || !newService.price || !newService.category) {
      return NextResponse.json(
        { error: '名前、所要時間、料金、カテゴリは必須項目です' },
        { status: 400 }
      );
    }

    if (newService.duration <= 0 || newService.price < 0) {
      return NextResponse.json(
        { error: '所要時間は1分以上、料金は0円以上である必要があります' },
        { status: 400 }
      );
    }

    const data = await readServices();
    
    // 名前の重複チェック
    const existingService = data.services.find(s => s.name === newService.name && s.isActive);
    if (existingService) {
      return NextResponse.json(
        { error: 'このサービス名は既に使用されています' },
        { status: 400 }
      );
    }
    
    // 新しいIDを生成（既存のIDの最大値 + 1）
    const maxId = data.services.reduce((max, service) => 
      Math.max(max, parseInt(service.id) || 0), 0
    );
    const newId = (maxId + 1).toString();

    // 新しいサービスデータを作成
    const service: Service = {
      id: newId,
      name: newService.name.trim(),
      duration: parseInt(newService.duration),
      price: parseInt(newService.price),
      category: newService.category.trim(),
      description: newService.description?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // データに追加
    data.services.push(service);
    
    // ファイルに保存
    await writeServices(data);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('サービス作成エラー:', error);
    return NextResponse.json(
      { error: 'サービスの作成に失敗しました' },
      { status: 500 }
    );
  }
}