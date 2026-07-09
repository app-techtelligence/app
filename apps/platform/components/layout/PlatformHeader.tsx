import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function PlatformHeader() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <LogoMark className="h-8 w-auto text-navy" />
          <Wordmark className="text-sm sm:text-base" />
          <span className="ml-1 rounded bg-navy/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-steel">
            {t("brand.beta")}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {user ? (
            <form action={signOut} className="flex items-center gap-3">
              <span className="hidden max-w-48 truncate text-xs text-steel sm:block">
                {user.email}
              </span>
              <button
                type="submit"
                className="text-sm font-semibold text-navy/75 transition-colors hover:text-navy"
              >
                {t("header.logout")}
              </button>
            </form>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
