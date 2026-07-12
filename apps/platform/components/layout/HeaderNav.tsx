"use client";

import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { ResourcesMenu } from "./ResourcesMenu";

type Props = {
  /** Where "back to the course" leads: the enrolled course, or the dashboard. */
  courseHref: ComponentProps<typeof Link>["href"];
  courseLabel: string;
};

/**
 * Nav slot next to the logo. On the job-tracker page the Recursos dropdown
 * gives way to a single "Curso" link — the way back to the course a student
 * left to check their applications. Everywhere else: the dropdown.
 */
export function HeaderNav({ courseHref, courseLabel }: Props) {
  const pathname = usePathname();

  if (pathname === "/job-tracker") {
    return (
      <Link
        href={courseHref}
        className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm font-semibold text-navy/75 transition-colors hover:text-navy sm:px-2"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        {courseLabel}
      </Link>
    );
  }

  return <ResourcesMenu />;
}
