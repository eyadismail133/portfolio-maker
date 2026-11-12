"use client";

import { useId, useState } from "react";
import { pickText } from "@/render-kit/i18n";
import type { FieldDef } from "@/render-kit/registry";
import type { AssetRef, Lang, LocalizedText } from "@/render-kit/schema/primitives";
import { ICON_NAMES, Icon } from "@/render-kit/sections/icons";
import {
  getAt,
  otherLanguageText,
  readLocalized,
  setAt,
  writeLocalized,
  type Path,
} from "./doc-ops";
import { useEditor } from "./store";
import { IconButton, Label, buttonClass, inputClass } from "./ui";

export type FormContext = {
  lang: Lang;
  languages: readonly Lang[];
  /** True when the text at this path keeps one value per language. */
  isLocalized: (path: Path) => boolean;
};

type FieldProps = {
  field: FieldDef;
  value: unknown;
  path: Path;
  ctx: FormContext;
  /** `group` joins quick edits of the same field into one undo step. */
  onChange: (value: unknown, group?: string) => void;
};

const MONTH = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

function TextField({ field, value, path, ctx, onChange }: FieldProps) {
  const id = useId();
  const localized = ctx.isLocalized(path);
  const text = localized ? readLocalized(value as LocalizedText, ctx.lang) : String(value ?? "");
  const hint = localized ? otherLanguageText(value as LocalizedText, ctx.lang) : "";
  const write = (next: string) =>
    onChange(
      localized ? writeLocalized(value as LocalizedText, ctx.lang, next, ctx.languages) : next,
      path.join("."),
    );
  const shared = {
    id,
    value: text,
    placeholder: hint,
    dir: localized && ctx.lang === "ar" ? ("rtl" as const) : ("auto" as const),
    className: inputClass,
  };
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "longtext" ? (
        <textarea {...shared} rows={4} onChange={(e) => write(e.target.value)} />
      ) : (
        <input {...shared} type="text" onChange={(e) => write(e.target.value)} />
      )}
    </div>
  );
}

function UrlField({ field, value, path, onChange }: FieldProps) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{field.label}</Label>
      <input
        id={id}
        type="url"
        dir="ltr"
        inputMode="url"
        placeholder="https://"
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value, path.join("."))}
      />
    </div>
  );
}

function LinkField(props: FieldProps) {
  const link = (props.value ?? {}) as { label?: LocalizedText; href?: string };
  const set = (key: "label" | "href") => (next: unknown, group?: string) =>
    props.onChange({ label: link.label ?? "", href: link.href ?? "", [key]: next }, group);
  return (
    <fieldset className="grid gap-2 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <legend className="px-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {props.field.label}
      </legend>
      <TextField
        {...props}
        field={{ key: "label", label: "Text", type: "text" }}
        value={link.label}
        path={[...props.path, "label"]}
        onChange={set("label")}
      />
      <UrlField
        {...props}
        field={{ key: "href", label: "Goes to", type: "url" }}
        value={link.href}
        path={[...props.path, "href"]}
        onChange={set("href")}
      />
    </fieldset>
  );
}

function ImageField({ field, value, path, onChange }: FieldProps) {
  const id = useId();
  const asset = value as AssetRef | undefined;
  const uploader = useEditor((s) => s.uploader);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const update = (url: string, alt: string) =>
    onChange(
      url.trim()
        ? {
            assetId: asset?.url === url.trim() ? asset.assetId : url.trim(),
            url: url.trim(),
            alt,
            width: asset?.width ?? 1200,
            height: asset?.height ?? 900,
          }
        : undefined,
      path.join("."),
    );
  const upload = async (file: File | undefined) => {
    if (!file || !uploader) return;
    setBusy(true);
    setProblem("");
    try {
      onChange({ ...(await uploader(file)), alt: asset?.alt ?? "" });
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <fieldset className="grid gap-2 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <legend className="px-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {field.label}
      </legend>
      {asset && (
        // eslint-disable-next-line @next/next/no-img-element -- a plain preview of the chosen image
        <img
          src={asset.url}
          alt=""
          className="max-h-32 w-full rounded border border-zinc-200 object-cover dark:border-zinc-800"
        />
      )}
      {uploader && (
        <div className="flex items-center gap-2">
          <label
            className={`${buttonClass} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            {busy ? "Uploading…" : asset ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {asset && (
            <button type="button" className={buttonClass} onClick={() => onChange(undefined)}>
              Remove
            </button>
          )}
        </div>
      )}
      {problem && (
        <p role="alert" className="text-xs text-red-600">
          {problem}
        </p>
      )}
      <div className="grid gap-1">
        <Label htmlFor={id}>{uploader ? "Or paste an image address" : "Image address"}</Label>
        <input
          id={id}
          type="url"
          dir="ltr"
          placeholder="https://"
          className={inputClass}
          value={asset?.url ?? ""}
          onChange={(e) => update(e.target.value, asset?.alt ?? "")}
        />
      </div>
      {asset && (
        <div className="grid gap-1">
          <Label htmlFor={`${id}-alt`}>Describe the image for people who cannot see it</Label>
          <input
            id={`${id}-alt`}
            type="text"
            dir="auto"
            className={inputClass}
            value={asset.alt}
            onChange={(e) => update(asset.url, e.target.value)}
          />
        </div>
      )}
      {!uploader && (
        <p className="text-xs text-zinc-500">
          Create an account to upload images from your device.
        </p>
      )}
    </fieldset>
  );
}

function MonthField({ field, value, path, onChange }: FieldProps) {
  const id = useId();
  const stored = String(value ?? "");
  const isCurrent = stored === "current";
  // Typing passes through values that are not a date yet, so keep them here until they are.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (isCurrent ? "" : stored);
  const invalid = draft !== null && draft !== "" && !MONTH.test(draft);
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{field.label}</Label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="text"
          dir="ltr"
          inputMode="numeric"
          placeholder="2024-03 or 2024"
          disabled={isCurrent}
          aria-invalid={invalid}
          className={`${inputClass} ${invalid ? "border-red-500" : ""}`}
          value={shown}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (next === "" || MONTH.test(next)) {
              setDraft(null);
              onChange(next, path.join("."));
            } else setDraft(next);
          }}
          onBlur={() => setDraft(null)}
        />
        {field.type === "end-month" && (
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => onChange(e.target.checked ? "current" : "")}
            />
            Until now
          </label>
        )}
      </div>
      {invalid && (
        <p className="text-xs text-red-600">Write a year and month like 2024-03, or only a year.</p>
      )}
    </div>
  );
}

function LevelField({ field, value, onChange }: FieldProps) {
  const level = typeof value === "number" ? value : 0;
  return (
    <div className="grid gap-1">
      <Label>{field.label}</Label>
      <div role="group" aria-label={field.label} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={level === n}
            aria-label={`${n} of 5`}
            onClick={() => onChange(n)}
            className={`h-7 flex-1 rounded text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${
              n <= level
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconField({ field, value, onChange }: FieldProps) {
  return (
    <div className="grid gap-1">
      <Label>{field.label}</Label>
      <div role="group" aria-label={field.label} className="grid grid-cols-8 gap-1">
        {ICON_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={`flex aspect-square items-center justify-center rounded p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600 [&_svg]:size-full ${
              value === name
                ? "bg-blue-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon name={name} boxed={false} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleField({ field, value, onChange }: FieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
      {field.label}
    </label>
  );
}

function SelectField({ field, value, onChange }: FieldProps) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{field.label}</Label>
      <select
        id={id}
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Controls to reorder and remove one row of a list. */
function RowTools(props: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex shrink-0">
      <IconButton
        icon="up"
        label="Move up"
        disabled={props.index === 0}
        onClick={() => props.onMove(-1)}
      />
      <IconButton
        icon="down"
        label="Move down"
        disabled={props.index === props.count - 1}
        onClick={() => props.onMove(1)}
      />
      <IconButton icon="trash" label="Remove" onClick={props.onRemove} />
    </span>
  );
}

function moved<T>(items: T[], index: number, delta: -1 | 1): T[] {
  const copy = [...items];
  [copy[index], copy[index + delta]] = [copy[index + delta], copy[index]];
  return copy;
}

function TextListField(props: FieldProps) {
  const items = Array.isArray(props.value) ? (props.value as unknown[]) : [];
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {props.field.label}
      </legend>
      {items.map((item, i) => (
        <div key={i} className="flex items-end gap-1">
          <div className="min-w-0 flex-1">
            <TextField
              {...props}
              field={{ key: String(i), label: `${props.field.label} ${i + 1}`, type: "text" }}
              value={item}
              path={[...props.path, i]}
              onChange={(next, group) =>
                props.onChange(
                  items.map((old, j) => (j === i ? next : old)),
                  group,
                )
              }
            />
          </div>
          <RowTools
            index={i}
            count={items.length}
            onMove={(delta) => props.onChange(moved(items, i, delta))}
            onRemove={() => props.onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        className={`${buttonClass} justify-self-start`}
        onClick={() => props.onChange([...items, ""])}
      >
        Add
      </button>
    </fieldset>
  );
}

function ListField(props: FieldProps) {
  const { field, ctx } = props;
  const items = Array.isArray(props.value) ? (props.value as Record<string, unknown>[]) : [];
  const [open, setOpen] = useState<number | null>(null);
  const titleKey = field.fields?.find((f) => f.type === "text")?.key;
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {field.label}
      </legend>
      {items.map((item, i) => {
        const raw = titleKey ? item[titleKey] : undefined;
        const title =
          (typeof raw === "string" || (raw && typeof raw === "object")
            ? pickText(raw as LocalizedText, ctx.lang)
            : "") || `Item ${i + 1}`;
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1 py-0.5 pe-0.5 ps-1">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="min-w-0 flex-1 truncate rounded px-1.5 py-1.5 text-start text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <bdi>{title}</bdi>
              </button>
              <RowTools
                index={i}
                count={items.length}
                onMove={(delta) => {
                  props.onChange(moved(items, i, delta));
                  setOpen(null);
                }}
                onRemove={() => {
                  props.onChange(items.filter((_, j) => j !== i));
                  setOpen(null);
                }}
              />
            </div>
            {isOpen && (
              <div className="border-t border-zinc-200 p-2.5 dark:border-zinc-800">
                <FormFields
                  fields={field.fields ?? []}
                  value={item}
                  path={[...props.path, i]}
                  ctx={ctx}
                  onChange={(next, group) =>
                    props.onChange(
                      items.map((old, j) => (j === i ? next : old)),
                      group,
                    )
                  }
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className={`${buttonClass} mt-0.5 justify-self-start`}
        onClick={() => {
          props.onChange([...items, {}]);
          setOpen(items.length);
        }}
      >
        Add
      </button>
    </fieldset>
  );
}

const COMPONENTS: Record<FieldDef["type"], (props: FieldProps) => React.ReactElement> = {
  text: TextField,
  longtext: TextField,
  url: UrlField,
  link: LinkField,
  image: ImageField,
  month: MonthField,
  "end-month": MonthField,
  level: LevelField,
  icon: IconField,
  toggle: ToggleField,
  select: SelectField,
  "text-list": TextListField,
  list: ListField,
};

/** A form built from a list of field definitions. Used for a whole section and for list items. */
export function FormFields(props: {
  fields: FieldDef[];
  value: Record<string, unknown>;
  path: Path;
  ctx: FormContext;
  onChange: (value: Record<string, unknown>, group?: string) => void;
}) {
  return (
    <div className="grid gap-3.5">
      {props.fields.map((field) => {
        const Component = COMPONENTS[field.type];
        // A key such as "problem.title" points into a nested object.
        const keys = field.key.split(".");
        return (
          <Component
            key={field.key}
            field={field}
            value={getAt(props.value, keys)}
            path={[...props.path, ...keys]}
            ctx={props.ctx}
            onChange={(next, group) => props.onChange(setAt(props.value, keys, next), group)}
          />
        );
      })}
    </div>
  );
}
