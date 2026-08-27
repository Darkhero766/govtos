import './globals.css';
import './hero-upgrade.css';
import './product-upgrade.css';
import './impeccable-ui.css';
import './button-depth.css';
import './final-polish.css';
import './mobile-final.css';
import './production-fixes.css';
import EvidenceUploadBridge from './evidence-upload-bridge';
import HindiTranslate from './hindi-translate';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'First Response | Cyber Crime Support', description: 'Report cyber incidents, get urgent help, and track complaint references in one place.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><EvidenceUploadBridge /><HindiTranslate />{children}</body></html>;
}
