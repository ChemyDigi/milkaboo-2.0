import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";

/** The marketing site: smooth scrolling and the floating header. The game lives outside this group. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScroll>
      <Header />
      {children}
    </SmoothScroll>
  );
}
