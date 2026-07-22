"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Chrome removed inline installation in 2018 (fully disabled in Chrome 71),
 * so no site can install an extension in place — the store page is a required
 * stop for everyone. What we CAN avoid is sending people somewhere that
 * cannot work: mobile browsers support no extensions at all, and Safari and
 * Firefox can't use a Chrome build. Those users get an honest alternative
 * instead of a dead end.
 *
 * Set STORE_URL once the Web Store listing is approved and the button becomes
 * a straight "Add to Chrome". Until then it serves the packaged build.
 */
const STORE_URL = "";

const ZIP = "/downloads/the-fibre-set-extension.zip";

type Env = "chromium" | "safari" | "firefox" | "mobile" | "unknown";

function detect(): Env {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
  if (/Edg\//.test(ua)) return "chromium";
  if (/OPR\//.test(ua)) return "chromium";
  if (/Chrome\//.test(ua)) return "chromium";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua)) return "safari";
  return "unknown";
}

const PRIMARY =
  "rounded-full bg-primary px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90";
const SECONDARY =
  "rounded-full border border-border px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate";

export function InstallExtension() {
  // render the neutral state first so the server and client markup agree
  const [env, setEnv] = useState<Env>("unknown");
  useEffect(() => setEnv(detect()), []);

  if (env === "mobile") {
    return (
      <div className="mt-9">
        <Link href="/analyze" className={PRIMARY}>
          Check a link instead →
        </Link>
        <p className="mx-auto mt-4 max-w-[46ch] text-[14px] font-light leading-relaxed text-muted-foreground">
          Browser extensions don&apos;t run on phones — that&apos;s a limit of mobile browsers, not
          of us. Paste a product link into Fabric Check and you&apos;ll get the same reading. Come
          back on a laptop to install it.
        </p>
      </div>
    );
  }

  if (env === "safari" || env === "firefox") {
    const name = env === "safari" ? "Safari" : "Firefox";
    return (
      <div className="mt-9">
        <Link href="/analyze" className={PRIMARY}>
          Check a link instead →
        </Link>
        <p className="mx-auto mt-4 max-w-[48ch] text-[14px] font-light leading-relaxed text-muted-foreground">
          We don&apos;t have a {name} build yet — the extension is Chrome and Edge for now. Paste a
          product link into Fabric Check for the same reading in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-9">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {STORE_URL ? (
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className={PRIMARY}>
            Add to Chrome — free
          </a>
        ) : (
          <a href={ZIP} download className={PRIMARY}>
            Download for Chrome &amp; Edge
          </a>
        )}
        <Link href="/analyze" className={SECONDARY}>
          Or check a link on the web →
        </Link>
      </div>
      <p className="mx-auto mt-4 max-w-[54ch] text-[14px] font-light leading-relaxed text-muted-foreground">
        {STORE_URL ? (
          <>Opens the Chrome Web Store. Free, and it asks for no access to your browsing.</>
        ) : (
          <>
            Free. We&apos;re not in the Chrome Web Store yet, so this is a manual install — three
            steps below, about a minute. Nothing to sign up for.
          </>
        )}
      </p>
    </div>
  );
}
