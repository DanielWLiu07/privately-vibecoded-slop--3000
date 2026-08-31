import { Fragment } from "react";
import { SITE } from "@/siteConfig";

/**
 * The standing blurb above the upcoming-events grid.
 *
 * The copy lives here as PLAIN STRINGS because it is set twice: once in the
 * markup with working links, and once onto a canvas in the 3D stage, which
 * cannot carry an anchor. Both read from INTRO_PARAGRAPHS and the JSX is built
 * by splitting those strings around the linked phrase, so the two can never
 * drift apart — change a word here and the table changes with it.
 */
export const INTRO_PARAGRAPHS: readonly string[] = [
  "We hold regular events on campus, including workshops, panels, game nights, and competitions. We try to record all of our educational events, so if you miss one, check out our Events Archive below!",
  "If you’re looking to attend our application-based competitions, one of the best ways to show interest is to attend and check-in to our events! To do so, make sure you have signed up on our member portal.",
];

/** The phrase in each paragraph that is a link, and where it goes. */
const LINKS: { phrase: string; href: string }[] = [
  { phrase: "Events Archive", href: "#events-archive" },
  { phrase: "member portal", href: SITE.memberPortalUrl },
];

/** Split `text` around `phrase` and render the middle as an anchor. */
function linkify(text: string, phrase: string, href: string) {
  const at = text.indexOf(phrase);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <a href={href}>{phrase}</a>
      {text.slice(at + phrase.length)}
    </>
  );
}

export default function EventsIntro() {
  return (
    <div className="prose">
      {INTRO_PARAGRAPHS.map((text, i) => (
        <Fragment key={i}>
          <p>{LINKS[i] ? linkify(text, LINKS[i].phrase, LINKS[i].href) : text}</p>
        </Fragment>
      ))}
    </div>
  );
}
