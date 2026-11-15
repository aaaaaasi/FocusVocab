import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '词刻 · 英语背词与记忆训练',
  description:
    '支持先猜后看主动回忆、1/2/4/7/15 天记忆曲线复习、同词性小测与拼写纠错、1080×1440 打卡战绩卡的多词库背词工具。',
  openGraph: {
    title: '词刻 · 英语背词与记忆训练',
    description:
      '支持主动回忆遮罩、记忆曲线复习、同词性小测与拼写纠错的多词库背词工具。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '词刻 · 英语背词与记忆训练',
    description:
      '支持主动回忆遮罩、记忆曲线复习、同词性小测与拼写纠错的多词库背词工具。',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
