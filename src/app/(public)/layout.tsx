import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { ScrollRevealInit } from '@/components/layout/ScrollRevealInit';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <ScrollProgress />
      <ScrollRevealInit />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
  );
}
