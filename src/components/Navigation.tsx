'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    // 現在のパスが指定したパスで始まる場合にアクティブとみなす
    // これにより /appointments/123 などでも /appointments がアクティブになる
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <nav className="bg-foreground text-background p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Hair Karte
        </Link>
        
        <div className="flex space-x-4">
          <Link 
            href="/calendar" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/calendar') 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`}
          >
            カレンダー
          </Link>
          <Link 
            href="/appointments" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/appointments') 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`}
          >
            予約一覧
          </Link>
          <Link 
            href="/customers" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/customers') 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`}
          >
            顧客管理
          </Link>
          <Link 
            href="/services" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/services') 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`}
          >
            メニュー管理
          </Link>
          <Link 
            href="/reports" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/reports') 
                ? 'bg-blue-700 text-white' 
                : 'text-gray-200 hover:bg-gray-700 hover:text-white'
            }`}
          >
          </Link>
        </div>

        <div className="flex items-center">
          <span className="text-sm mr-2">山田 美容師</span>
          <button className="bg-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-700">
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;