import { notFound } from "next/navigation";

/** Funnels every unknown path into the localized not-found page. */
export default function CatchAllPage() {
  notFound();
}
