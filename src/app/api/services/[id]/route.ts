// src/app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SERVICES_FILE_PATH = path.join(process.cwd(), 'data', 'services.json');

// サービスデータの型定義
type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
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
    return { services: [] };
  }
}

// JSONファイルの書き込み
async function writeServices(data: ServicesData): Promise<void> {
  try {
    const dataDir = path.dirname(SERVICES_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(SERVICES_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('サービスデータの書き込みエラー:', error);
    throw error;
  }
}

// GET: 特定のサービスを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readServices();
    const service = data.services.find(s => s.id === params.id);
    
    if (!service) {
      return NextResponse.json(
        { error: 'サービスが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('サービスデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'サービスデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: サービスの更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedData = await request.json();
    const data = await readServices();
    
    const serviceIndex = data.services.findIndex(s => s.id === params.id);
    
    if (serviceIndex === -1) {
      return NextResponse.json(
        { error: 'サービスが見つかりません' },
        { status: 404 }
      );
    }

    // バリデーション
    if (updatedData.name && updatedData.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'サービス名は必須項目です' },
        { status: 400 }
      );
    }

    if (updatedData.duration && updatedData.duration <= 0) {
      return NextResponse.json(
        { error: '所要時間は1分以上である必要があります' },
        { status: 400 }
      );
    }

    if (updatedData.price && updatedData.price < 0) {
      return NextResponse.json(
        { error: '料金は0円以上である必要があります' },
        { status: 400 }
      );
    }

    // 名前の重複チェック（自分以外で同じ名前がないか）
    if (updatedData.name) {
      const existingService = data.services.find(s => 
        s.id !== params.id && 
        s.name === updatedData.name.trim() && 
        s.isActive
      );
      if (existingService) {
        return NextResponse.json(
          { error: 'このサービス名は既に使用されています' },
          { status: 400 }
        );
      }
    }

    // 既存のサービスデータを更新
    const existingService = data.services[serviceIndex];
    const updatedService: Service = {
      ...existingService,
      ...updatedData,
      id: params.id, // IDは変更不可
      name: updatedData.name?.trim() || existingService.name,
      category: updatedData.category?.trim() || existingService.category,
      description: updatedData.description?.trim() || existingService.description,
      updatedAt: new Date().toISOString()
    };

    data.services[serviceIndex] = updatedService;
    
    await writeServices(data);

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('サービス更新エラー:', error);
    return NextResponse.json(
      { error: 'サービスの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: サービスの削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readServices();
    
    const serviceIndex = data.services.findIndex(s => s.id === params.id);
    
    if (serviceIndex === -1) {
      return NextResponse.json(
        { error: 'サービスが見つかりません' },
        { status: 404 }
      );
    }

    // 論理削除（isActiveをfalseにする）
    const service = data.services[serviceIndex];
    service.isActive = false;
    service.updatedAt = new Date().toISOString();
    
    await writeServices(data);

    return NextResponse.json({ message: 'サービスを削除しました', service });
  } catch (error) {
    console.error('サービス削除エラー:', error);
    return NextResponse.json(
      { error: 'サービスの削除に失敗しました' },
      { status: 500 }
    );
  }
}