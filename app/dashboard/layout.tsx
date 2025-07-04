import { Inter } from 'next/font/google';
import { Header } from '@/components/header-system';
import { auth } from '@/auth';
import { Toaster } from '@/components/ui/sonner';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'RDRDC Group PMS',
  description: 'Enterprise property management system',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: RootLayoutProps) {
  const session = await auth();

  const user = session?.user ? {
    name: `${session.user.firstName} ${session.user.lastName}`,
    email: session.user.email as string,
    image: session.user.image as string,
  } : undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header user={user} />
          <main className="flex-1">
            <Providers>
              {children}
              <Toaster />
              </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}