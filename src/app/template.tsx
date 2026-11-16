import { RouteTransition } from "@/components/RouteTransition";

/** Remounts on every navigation between top-level screens, which plays the route transition. */
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
