import { describe, expect, it } from "vitest";
import { safeFetchUrl } from "@/lib/url-safety";

describe("safeFetchUrl — SSRF guard for the analyzer", () => {
  it("accepts normal public product links", () => {
    expect(safeFetchUrl("https://www.zara.com/uk/en/product/123.html")?.hostname).toBe("www.zara.com");
    expect(safeFetchUrl("http://komodo.co.uk/products/pina-jumper")?.hostname).toBe("komodo.co.uk");
  });

  it("rejects non-http(s) schemes", () => {
    for (const u of ["file:///etc/passwd", "ftp://x.com", "data:text/html,x", "javascript:alert(1)"]) {
      expect(safeFetchUrl(u)).toBeNull();
    }
  });

  it("rejects loopback and localhost", () => {
    for (const u of ["http://localhost/", "http://localhost:3000/admin", "http://127.0.0.1/", "http://[::1]/", "http://0.0.0.0/"]) {
      expect(safeFetchUrl(u)).toBeNull();
    }
  });

  it("rejects cloud metadata and private ranges", () => {
    for (const u of [
      "http://169.254.169.254/latest/meta-data/", // AWS/GCP metadata
      "http://10.0.0.5/",
      "http://192.168.1.1/",
      "http://172.16.0.1/",
      "http://172.31.255.255/",
      "http://100.64.0.1/", // CGNAT
    ]) {
      expect(safeFetchUrl(u)).toBeNull();
    }
  });

  it("allows public IPs and 172.x outside the private block", () => {
    expect(safeFetchUrl("http://8.8.8.8/")).not.toBeNull();
    expect(safeFetchUrl("http://172.15.0.1/")).not.toBeNull(); // just below private range
    expect(safeFetchUrl("http://172.32.0.1/")).not.toBeNull(); // just above
  });

  it("rejects .local/.internal and IPv6 link/unique-local", () => {
    expect(safeFetchUrl("http://printer.local/")).toBeNull();
    expect(safeFetchUrl("http://svc.internal/")).toBeNull();
    expect(safeFetchUrl("http://[fe80::1]/")).toBeNull();
    expect(safeFetchUrl("http://[fd12:3456::1]/")).toBeNull();
  });

  it("rejects URLs carrying credentials, junk, and over-long input", () => {
    expect(safeFetchUrl("http://user:pass@internal.host/")).toBeNull();
    expect(safeFetchUrl("not a url")).toBeNull();
    expect(safeFetchUrl(null)).toBeNull();
    expect(safeFetchUrl(12345)).toBeNull();
    expect(safeFetchUrl("https://x.com/" + "a".repeat(3000))).toBeNull();
  });
});
