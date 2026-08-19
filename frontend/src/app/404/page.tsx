import type { Metadata } from 'next';
import NotFound from '@/app/not-found';

export const metadata: Metadata = {
  title: 'Page Not Found - VaultX',
  description: "The file or page you're looking for doesn't exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page404() {
  return <NotFound />;
}
