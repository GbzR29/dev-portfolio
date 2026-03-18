// src/lib/tracks/types.ts

import { ReactNode } from "react";

export interface Chapter {
  id: string;
  title: string;
  minRead?: number;
  /** Content is a function so it can receive the current translations object */
  content: (t: any) => ReactNode;
}

export interface Track {
  id: string;
  title: string;
  chapters: Chapter[];
}