// src/lib/reference/seo.ts
// Titles and descriptions of the API reference pages
// (/learn/<track>/reference and /learn/<track>/reference/<function>), built
// on the server from the same entries the pages show. English only: the
// reference has no /pt copy.

import type { Metadata } from "next";
import { displayName, getReference, referenceHref, referenceIndex } from "./index";

const SITE_NAME = "gabrielfrc.dev";

function meta(title: string, description: string, url: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "article" },
  };
}

/** "glDrawArrays — …" is about as long as a result title gets, so keep the tail short. */
export function referenceMetadata(trackPath: string): Metadata {
  const ref = getReference(trackPath);
  if (!ref) return {};
  const name = trackPath;
  return meta(
    `${name} Function Reference: all ${ref.entries.length} functions explained`,
    `Every ${name} function used in the course, explained for beginners: parameters, accepted values, common errors and a short C++ example.`,
    referenceHref(ref),
  );
}

export function functionMetadata(trackPath: string, fn: string): Metadata {
  const ref = getReference(trackPath);
  const entry = ref && referenceIndex(ref).get(fn);
  if (!ref || !entry) return {};
  const name = displayName(entry);
  return meta(
    `${name} — ${trackPath} reference`,
    `${name}: ${entry.summary.en} ${entry.family ? "How to read the names, every variant and a C++ example." : "Parameters, accepted values, common errors and a C++ example."}`,
    referenceHref(ref, entry.name),
  );
}
