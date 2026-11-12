import { PreviewFrame } from "@/editor/PreviewFrame";

export const metadata = { title: "Preview", robots: { index: false } };

/** Loaded inside the editor's frame. It shows nothing until the editor sends a document. */
export default function PreviewPage() {
  return <PreviewFrame />;
}
