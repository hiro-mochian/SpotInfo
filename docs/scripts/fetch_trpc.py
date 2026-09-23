#!/usr/bin/env python3
"""Fetch a public Manus *.manus.space URL using a browser User-Agent.

Bare curl is often blocked with Cloudflare Error 1010 (browser_signature_banned).
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/129.0.0.0 Safari/537.36"
)


def fetch(url: str, timeout: int = 20) -> tuple[int, str, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/html;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.getheader("content-type") or "", resp.read()
    except urllib.error.HTTPError as err:
        return err.code, err.headers.get("content-type") or "", err.read()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="https://{space}.manus.space/... URL")
    parser.add_argument("--out", help="optional file to write the body")
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    status, content_type, body = fetch(args.url, timeout=args.timeout)
    print(f"status={status} content-type={content_type} bytes={len(body)}")
    if status == 403 and b"1010" in body:
        print("Cloudflare 1010: browser signature banned. Retry from My Browser.", file=sys.stderr)
        sys.stderr.write(body[:400].decode("utf-8", "replace") + "\n")
        return 2

    if args.out:
        Path(args.out).write_bytes(body)
        print(f"wrote {args.out}")

    text = body.decode("utf-8", "replace")
    if "json" in content_type:
        try:
            parsed = json.loads(text)
            print(json.dumps(parsed, ensure_ascii=False, indent=2)[:8000])
        except json.JSONDecodeError:
            print(text[:2000])
    else:
        print(text[:2000])
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    raise SystemExit(main())
