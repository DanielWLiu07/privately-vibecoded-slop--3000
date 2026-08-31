import { Suspense, lazy } from "react";
import CalendarSubscribe from "@/components/CalendarSubscribe";
import EventsArchive from "@/components/EventsArchive";
import Footer from "@/components/Footer";

/**
 * The stage pulls in three.js, so it is split out of the initial bundle: the
 * archive below it is plain markup and should not wait on a renderer to paint.
 */
const EventsStage = lazy(() => import("@/three/EventsStage"));

export default function App() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-5xl px-6 py-10" id="events">
        <Suspense
          fallback={
            <div className="h-[min(86vh,46rem)] min-h-[30rem] w-full animate-pulse rounded-2xl bg-muted/30" />
          }
        >
          <EventsStage />
        </Suspense>

        <CalendarSubscribe />

        <EventsArchive />
      </main>
      <Footer />
    </div>
  );
}
