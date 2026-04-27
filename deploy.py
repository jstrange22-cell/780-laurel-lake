"""
Hostinger SFTP deploy for the 780 Laurel Lake listing site.

Usage:
    python deploy.py           # uploads dist/ to remote
    python deploy.py --dry     # report only, no upload

Requires: paramiko (pip install paramiko python-dotenv)
Reads credentials from .env at the project root:
    HOSTINGER_HOST=...
    HOSTINGER_USER=...
    HOSTINGER_PASS=...
    HOSTINGER_PORT=22
    HOSTINGER_PATH=/home/u959857201/domains/yourdomain.com/public_html/laurel-lake
"""
from __future__ import annotations

import argparse
import os
import posixpath
import sys
from pathlib import Path

try:
    import paramiko  # type: ignore
except ImportError:  # pragma: no cover
    sys.stderr.write("paramiko is required. Run: pip install paramiko python-dotenv\n")
    sys.exit(1)

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except ImportError:
    pass  # .env loading is optional


PROJECT_ROOT = Path(__file__).resolve().parent
DIST = PROJECT_ROOT / "dist"


def env(key: str, default: str | None = None) -> str:
    val = os.environ.get(key, default)
    if val is None:
        sys.stderr.write(f"Missing env var: {key}\n")
        sys.exit(1)
    return val


def walk_dist():
    for path in DIST.rglob("*"):
        if path.is_file():
            rel = path.relative_to(DIST).as_posix()
            yield rel, path


def ensure_remote_dirs(sftp, remote_root: str, rel_path: str) -> None:
    parts = posixpath.dirname(rel_path).split("/")
    cur = remote_root
    for p in parts:
        if not p:
            continue
        cur = posixpath.join(cur, p)
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="don't upload, just print")
    args = parser.parse_args()

    if not DIST.exists():
        sys.stderr.write("dist/ not found. Run `pnpm run build` first.\n")
        sys.exit(1)

    host = env("HOSTINGER_HOST")
    user = env("HOSTINGER_USER")
    password = env("HOSTINGER_PASS")
    port = int(env("HOSTINGER_PORT", "22"))
    remote_path = env("HOSTINGER_PATH")

    files = list(walk_dist())
    total_bytes = sum(p.stat().st_size for _, p in files)
    print(f"Files: {len(files)}  ({total_bytes / 1024 / 1024:.1f} MB)")
    print(f"Target: {user}@{host}:{remote_path}")

    if args.dry:
        for rel, _ in files[:30]:
            print(f"  {rel}")
        if len(files) > 30:
            print(f"  … and {len(files) - 30} more")
        return

    transport = paramiko.Transport((host, port))
    transport.connect(username=user, password=password)
    try:
        sftp = paramiko.SFTPClient.from_transport(transport)
        if sftp is None:
            sys.stderr.write("Could not open SFTP channel\n")
            sys.exit(1)

        # Ensure root exists
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            sftp.mkdir(remote_path)

        n = len(files)
        uploaded = 0
        for i, (rel, local) in enumerate(files, 1):
            ensure_remote_dirs(sftp, remote_path, rel)
            remote = posixpath.join(remote_path, rel)
            sftp.put(str(local), remote)
            uploaded += local.stat().st_size
            pct = uploaded * 100 // total_bytes if total_bytes else 100
            print(f"  [{i:>3}/{n}]  {pct:>3}%  {rel}")

        sftp.close()
        print("✓ Deploy complete")
    finally:
        transport.close()


if __name__ == "__main__":
    main()
