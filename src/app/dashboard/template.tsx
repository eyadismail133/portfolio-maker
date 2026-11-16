import { RouteTransition } from "@/components/RouteTransition";

/** Plays the route transition between the dashboard and its inbox too. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
