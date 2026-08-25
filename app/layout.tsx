import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'First Response', description: 'Independent hackathon prototype for cyber crime first response.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
