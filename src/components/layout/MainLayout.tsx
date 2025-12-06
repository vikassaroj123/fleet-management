import { Sidebar } from './Sidebar';
import { ReactNode, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-[60] p-2.5 rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent shadow-lg transition-all hover:scale-105 active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-[280px] sm:w-72 p-0 bg-sidebar border-sidebar-border overflow-hidden [&>button]:hidden"
          >
            <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 overflow-auto min-h-screen w-full md:ml-0">
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-full w-full pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
