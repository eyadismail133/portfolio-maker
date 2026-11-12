"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/editor/Editor";

function SavedEditor() {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} portfolioId={id} />;
}

/** The editor for a saved portfolio. Only its owner gets past the login check and the database rules. */
export default function SavedEditorPage() {
  return (
    <Suspense>
      <SavedEditor />
    </Suspense>
  );
}
