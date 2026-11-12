import { formatRange } from "../i18n";
import type { SectionContext } from "../registry";

/** One row of a work or education history. */
export type Entry = {
  title: string;
  place: string;
  placeUrl?: string;
  location: string;
  start: string;
  end: string;
  body: string;
  points: string[];
};

function EntryBody({ entry, ctx }: { entry: Entry; ctx: SectionContext }) {
  const dates = formatRange(entry.start, entry.end, ctx.lang);
  return (
    <>
      <div className="pk-entry__top">
        <h3 className="pk-h3">{entry.title}</h3>
        {dates && <p className="pk-entry__dates">{dates}</p>}
      </div>
      {(entry.place || entry.location) && (
        <p className="pk-entry__place">
          {[entry.place, entry.location].filter(Boolean).join(", ")}
        </p>
      )}
      {entry.body && <p className="pk-entry__text">{entry.body}</p>}
      {entry.points.length > 0 && (
        <ul className="pk-entry__points">
          {entry.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** A history as a vertical line with a marker per entry. */
export function EntryTimeline({ entries, ctx }: { entries: Entry[]; ctx: SectionContext }) {
  return (
    <ol className="pk-timeline">
      {entries.map((entry, i) => (
        <li key={i} className="pk-entry">
          <EntryBody entry={entry} ctx={ctx} />
        </li>
      ))}
    </ol>
  );
}

/** A history as a grid of cards. */
export function EntryCards({ entries, ctx }: { entries: Entry[]; ctx: SectionContext }) {
  return (
    <ul className="pk-entry-cards">
      {entries.map((entry, i) => (
        <li key={i} className="pk-card pk-entry">
          <EntryBody entry={entry} ctx={ctx} />
        </li>
      ))}
    </ul>
  );
}
