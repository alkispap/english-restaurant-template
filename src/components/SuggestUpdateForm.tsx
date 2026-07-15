"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

type SuggestUpdateFormProps = {
  submissionEmail?: string;
};

export function SuggestUpdateForm({ submissionEmail }: SuggestUpdateFormProps) {
  const searchParams = useSearchParams();
  const initialRestaurant = bounded(searchParams.get("restaurant"));
  const initialArea = bounded(searchParams.get("area"));
  const initialListingSlug = bounded(searchParams.get("listing"));
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");

  function generateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = [
      "Restaurant directory correction request",
      `Restaurant: ${field(data, "restaurant")}`,
      `Area: ${field(data, "area")}`,
      initialListingSlug ? `Listing slug: ${initialListingSlug}` : "",
      `Issue type: ${field(data, "issueType")}`,
      `Current information: ${field(data, "currentInformation")}`,
      `Suggested correction: ${field(data, "suggestedCorrection")}`,
      `Evidence URL: ${field(data, "evidenceUrl")}`,
      `Relationship to restaurant: ${field(data, "relationship") || "Not specified"}`,
      `Additional notes: ${field(data, "notes") || "None"}`
    ].filter(Boolean);
    setDraft(lines.join("\n"));
    setStatus("Correction request generated below. It has not been sent.");
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setStatus("Correction request copied. It has not been sent by this website.");
    } catch {
      setStatus("Copying failed. Select and copy the generated request manually.");
    }
  }

  const mailto = submissionEmail && draft
    ? `mailto:${encodeURIComponent(submissionEmail)}?subject=${encodeURIComponent("Restaurant directory correction")}&body=${encodeURIComponent(draft)}`
    : undefined;

  return (
    <section aria-labelledby="correction-form-heading" className="rounded-md border border-line bg-white p-6 shadow-soft">
      <h2 id="correction-form-heading" className="text-xl font-bold text-ink">Build a structured correction request</h2>
      <p className="mt-3 leading-7 text-muted">
        This form prepares a request in your browser. The directory does not automatically submit, store, or publish what you enter.
      </p>

      <form className="mt-6 grid gap-5" onSubmit={generateDraft}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Restaurant name" name="restaurant" defaultValue={initialRestaurant} required />
          <Field label="Area or neighbourhood" name="area" defaultValue={initialArea} required />
        </div>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Detail that needs review
          <select name="issueType" required defaultValue="" className="rounded-md border border-line bg-white px-3 py-2.5 text-base font-normal text-ink">
            <option value="" disabled>Select a detail</option>
            <option>Business status</option>
            <option>Restaurant name or identity</option>
            <option>Address or map location</option>
            <option>Opening hours</option>
            <option>Website, phone, menu, or booking link</option>
            <option>Cuisine, dietary, or service information</option>
            <option>Rating or review count</option>
            <option>Missing restaurant</option>
            <option>Other</option>
          </select>
        </label>
        <TextArea label="What currently appears" name="currentInformation" required />
        <TextArea label="What it should say" name="suggestedCorrection" required />
        <Field label="Public evidence URL" name="evidenceUrl" type="url" placeholder="https://official-source.example/..." required />
        <Field label="Your relationship to the restaurant (optional)" name="relationship" placeholder="Owner, employee, customer, local resident..." />
        <TextArea label="Additional notes (optional)" name="notes" />
        <button type="submit" className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Generate correction request
        </button>
      </form>

      <p id="correction-status" role="status" aria-live="polite" aria-atomic="true" className="mt-4 text-sm font-semibold text-muted">
        {status}
      </p>

      {draft ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Generated request
            <textarea readOnly value={draft} rows={11} aria-describedby="correction-status" className="rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-sm font-normal text-ink" />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={copyDraft} className="rounded-md border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-orange-50">
              Copy request
            </button>
            {mailto ? (
              <a href={mailto} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
                Open email app
              </a>
            ) : null}
          </div>
          {!submissionEmail ? (
            <p className="text-sm leading-6 text-muted">
              A corrections mailbox has not been configured yet. Copy the request and retain it until the directory publishes a contact destination.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required = false
}: {
  label: string;
  name: string;
  type?: "text" | "url";
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="rounded-md border border-line bg-white px-3 py-2.5 text-base font-normal text-ink" />
    </label>
  );
}

function TextArea({ label, name, required = false }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      <textarea name={name} required={required} rows={4} className="rounded-md border border-line bg-white px-3 py-2.5 text-base font-normal text-ink" />
    </label>
  );
}

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function bounded(value: string | null) {
  return value?.slice(0, 200) ?? "";
}
