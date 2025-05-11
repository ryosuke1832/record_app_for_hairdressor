import { redirect } from 'next/navigation';

export default function Home() {
  // カレンダーページへリダイレクト
  redirect('/calendar');
}