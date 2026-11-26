import Hero from "@/components/Hero";
import VideoJourney from "@/components/VideoJourney";
import PageTransition from "@/components/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <main>
        <Hero />
        <VideoJourney />
      </main>
    </PageTransition>
  );
}
