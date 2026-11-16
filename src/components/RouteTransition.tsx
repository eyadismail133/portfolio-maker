import { ViewTransition, type ReactNode } from "react";

/**
 * Animates moving between app screens with the browser's View Transitions: the old screen
 * fades out quickly, the new one rises and fades in (CSS in `globals.css`, "Route transitions").
 * Used by `template.tsx` files, which remount on every navigation, so it plays only when the
 * screen changes, never on in-page updates. Browsers without View Transitions just swap screens.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="pm-route-in" exit="pm-route-out" default="none">
      {children}
    </ViewTransition>
  );
}
