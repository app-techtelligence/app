import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ResourcesMenu } from "./ResourcesMenu";
import { UserMenu } from "./UserMenu";

/** "Ada Lovelace" → "AL"; single word → first letter; falls back to the email. */
function initialsOf(fullName: string | null | undefined, email: string): string {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || email.charAt(0).toUpperCase();
}

export async function PlatformHeader() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let fullName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single<{ role: string; full_name: string | null }>();
    isAdmin = profile?.role === "admin";
    fullName = profile?.full_name?.trim() || null;
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect({ href: "/login", locale: await getLocale() });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <LogoMark className="h-8 w-auto text-navy" />
            {/* At 375px the logged-in row (menu + switcher + logout) only
                fits without the wordmark and beta chip — the mark stays. */}
            <Wordmark
              className={user ? "hidden text-base sm:inline" : "text-sm sm:text-base"}
            />
            <span className="ml-1 hidden rounded bg-navy/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-steel sm:inline">
              {t("brand.beta")}
            </span>
          </Link>
          {user ? <ResourcesMenu /> : null}
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-md bg-navy px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-navy-deep"
            >
              {t("header.admin")}
            </Link>
          ) : null}
          <LocaleSwitcher />
          {user ? (
            <UserMenu
              initials={initialsOf(fullName, user.email ?? "")}
              name={fullName}
              email={user.email ?? ""}
              labels={{
                accountMenu: t("header.accountMenu"),
                changePassword: t("header.changePassword"),
                logout: t("header.logout"),
              }}
              signOutAction={signOut}
            />
          ) : null}
        </div>
      </Container>
    </header>
  );
}
