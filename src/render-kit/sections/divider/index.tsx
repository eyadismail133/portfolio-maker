import { z } from "zod";
import { defineSection, type VariantComponent } from "../../registry";

const schema = z.object({ size: z.enum(["small", "medium", "large"]).default("medium") });
type Content = z.output<typeof schema>;

const make = (kind: "line" | "space"): VariantComponent<Content> =>
  function Divider({ content }) {
    return kind === "line" ? (
      <hr className="pk-divider__line" data-size={content.size} />
    ) : (
      <div className="pk-divider__space" data-size={content.size} aria-hidden="true" />
    );
  };

export const divider = defineSection({
  type: "divider",
  name: "Divider",
  category: "free",
  schema,
  defaults: () => ({ size: "medium" as const }),
  variants: {
    line: { name: "Line", component: make("line") },
    space: { name: "Empty space", component: make("space") },
  },
  defaultVariant: "line",
  fields: [{ key: "size", label: "Size", type: "select", options: ["small", "medium", "large"] }],
});
