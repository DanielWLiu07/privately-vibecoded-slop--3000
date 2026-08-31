import CalendarSubscribe from "./CalendarSubscribe";
import EventsIntro from "./EventsIntro";
import Section from "./Section";

export default function UpcomingEvents() {
  return (
    <Section id="upcoming-events" title="Upcoming Events">
      <EventsIntro />
      <CalendarSubscribe />
    </Section>
  );
}
