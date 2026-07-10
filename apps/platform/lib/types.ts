/** Row shapes for the platform tables (see supabase/migrations). */

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
