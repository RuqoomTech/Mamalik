import Link from "next/link";

type LegalLinksProps = {
  className?: string;
};

export function LegalLinks({ className = "" }: LegalLinksProps) {
  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mk-muted ${className}`}
    >
      <Link className="font-semibold text-mk-green underline" href="/privacy">
        Privacy Policy
      </Link>
      <Link className="font-semibold text-mk-green underline" href="/terms">
        Terms of Service
      </Link>
    </nav>
  );
}

export function GoogleLegalNotice() {
  return (
    <p className="text-xs leading-5 text-mk-muted">
      By continuing, you agree to the{" "}
      <Link className="font-semibold text-mk-green underline" href="/terms">
        Terms
      </Link>{" "}
      and acknowledge the{" "}
      <Link className="font-semibold text-mk-green underline" href="/privacy">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
