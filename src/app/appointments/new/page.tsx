// src/app/appointments/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AppointmentForm from '@/components/AppointmentForm';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // ページロード時にローディング状態を解除
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background pt-4 px-4 flex items-center justify-center">
          <div className="text-center">
            <p>読み込み中...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-4 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">新規予約登録</h1>
          <AppointmentForm initialDate={dateParam} initialTime={timeParam} />
        </div>
      </main>
    </>
  );
}