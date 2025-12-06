import { Sidebar } from './Sidebar';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen w-full">
        <div className="p-6 max-w-[1600px] mx-auto min-h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
