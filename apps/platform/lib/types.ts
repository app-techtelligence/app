/** Row shapes for the platform tables (see supabase/migrations). */

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_published: boolean;
  beta_open: boolean;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  description: string | null;
  video_key: string | null;
  duration_seconds: number | null;
  position: number;
  is_free_preview: boolean;
};

export type Enrollment = {
  user_id: string;
  course_id: string;
  status: "active" | "revoked";
};
