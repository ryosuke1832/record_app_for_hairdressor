'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    // 現在のパスが指定したパスで始まる場合にアクティブとみなす
    // これにより /appointments/123 などでも /appointments がアクティブになる
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigationItems = [
    { href: '/calendar', label: 'カレンダー', icon: '📅' },
    { href: '/appointments', label: '予約一覧', icon: '📝' },
    { href: '/customers', label: '顧客管理', icon: '👥' },
    { href: '/services', label: 'メニュー管理', icon: '✂️' }
  ];

  return (
    <nav className="bg-foreground text-background shadow-md relative">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link href="/" className="text-xl font-bold" onClick={closeMenu}>
            Hair Karte
          </Link>
          
          {/* デスクトップメニュー */}
          <div className="hidden md:flex space-x-2">
            {navigationItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href) 
                    ? 'bg-blue-700 text-white' 
                    : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* ユーザー情報（デスクトップ） */}
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-sm text-gray-300">山田 美容師</span>
            <button className="bg-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-700 transition-colors">
              ログアウト
            </button>
          </div>

          {/* ハンバーガーメニューボタン（モバイル） */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className={`w-full h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`w-full h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-full h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <>
            {/* オーバーレイ */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={closeMenu}
            />
            
            {/* メニューパネル */}
            <div className="absolute top-full left-0 right-0 bg-foreground border-t border-gray-600 z-50 md:hidden">
              <div className="py-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-700 text-white border-l-4 border-blue-400'
                        : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                
                {/* ユーザー情報（モバイル） */}
                <div className="border-t border-gray-600 mt-2 pt-2 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">山田 美容師</span>
                    <button className="bg-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-700 transition-colors">
                      ログアウト
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;