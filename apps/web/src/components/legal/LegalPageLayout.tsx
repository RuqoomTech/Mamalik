import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LegalLinks } from "./LegalLinks";

type LegalPageLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  subtitle,
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="mamalik-page">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="mamalik-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link className="flex items-center gap-4" href="/">
              <Image
                alt="Mamalik emblem"
                className="size-14 rounded-md border border-[#dfe5dc] bg-white object-cover shadow-sm"
                height={56}
                priority
                src="/brand/mamalik-logo.png"
                width={56}
              />
              <span>
                <span className="mamalik-eyebrow block">Mamalik</span>
                <span className="text-lg font-semibold text-[#10140f]">ممالك</span>
              </span>
            </Link>
            <LegalLinks />
          </div>
          <div className="mt-8 max-w-3xl">
            <p className="mamalik-eyebrow">Public policy</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#10140f]">
              {title}
            </h1>
            <p className="mt-3 text-base leading-7 text-[#5f665d]">{subtitle}</p>
          </div>
        </header>

        <article className="mamalik-card mt-6 space-y-8 p-6 text-sm leading-7 text-[#384036]">
          {children}
        </article>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[#5f665d]">
          <Link className="font-semibold text-[#183f35] underline" href="/">
            Back to home
          </Link>
          <LegalLinks />
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[#10140f]">{title}</h2>
      {children}
    </section>
  );
}
