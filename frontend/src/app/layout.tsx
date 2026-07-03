import type { Metadata } from 'next';
import './globals.css';
import AutoLogin from '@/components/AutoLogin';

export const metadata: Metadata = {
  title: 'ResumePilot AI - AI智能求职助手',
  description: '基于AI Agent技术的全链路智能求职助手',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AutoLogin />
        {children}
      </body>
    </html>
  );
}
