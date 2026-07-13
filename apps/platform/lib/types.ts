/** Row shapes for the platform tables (see supabase/migrations). */

import type { JobSource, JobStage, JobStatus } from "./job-tracker";

export type Course = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  is_published: boolean;
  beta_open: boolean;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  title_en: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  video_key: string | null;
  duration_seconds: number | null;
  position: number;
};

export type Enrollment = {
  user_id: string;
  course_id: string;
  status: "active" | "revoked";
};

export type JobApplication = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  website_url: string | null;
  salary: string | null;
  notes: string | null;
  first_contact_date: string | null;
  stage: JobStage;
  status: JobStatus;
  source: JobSource;
  created_at: string;
};

export type Post = {
  id: string;
  slug: string;
  slug_en: string;
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  body_md: string;
  body_md_en: string;
  cover_key: string | null;
  tags: string[];
  tags_en: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};
