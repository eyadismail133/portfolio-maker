import { Editor } from "@/editor/Editor";

export const metadata = { title: "Editor · Portfolio Maker" };

/** The editor working on a draft kept in this browser. Accounts and saved portfolios come in Phase 3. */
export default function EditorPage() {
  return <Editor />;
}
