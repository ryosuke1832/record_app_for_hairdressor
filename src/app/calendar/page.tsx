import React from 'react';
import CalendarView from '@/components/CalendarView';
import Navigation from '@/components/Navigation';

export default function CalendarPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <CalendarView />
      </main>
    </>
  );
}