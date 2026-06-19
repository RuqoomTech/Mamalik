import Link from "next/link";

type LegalLinksProps = {
  className?: string;
};

export function LegalLinks({ className = "" }: LegalLinksProps) {
  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#5f665d] ${className}`}
    >
      <Link className="font-semibold text-[#183f35] underline" href="/privacy">
        Privacy Policy
      </Link>
      <Link className="font-semibold text-[#183f35] underline" href="/terms">
        Terms of Service
      </Link>
    </nav>
  );
}

export function GoogleLegalNotice() {
  return (
    <p className="text-xs leading-5 text-[#5f665d]">
      By continuing, you agree to the{" "}
      <Link className="font-semibold text-[#183f35] underline" href="/terms">
        Terms
      </Link>{" "}
      and acknowledge the{" "}
      <Link className="font-semibold text-[#183f35] underline" href="/privacy">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
