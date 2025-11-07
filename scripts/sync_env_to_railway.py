#!/usr/bin/env python3
"""Sync .env variables to a Railway service before deployment."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key or not value:
            continue
        values[key] = value
    return values


def chunk_pairs(pairs: list[tuple[str, str]], size: int = 10) -> list[list[tuple[str, str]]]:
    return [pairs[i : i + size] for i in range(0, len(pairs), size)]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent

    parser = argparse.ArgumentParser(description="Sync environment variables to Railway.")
    parser.add_argument(
        "--env-file",
        default=repo_root / ".env",
        type=Path,
        help="Path to the .env file (default: repo_root/.env)",
    )
    parser.add_argument(
        "--service",
        default="night",
        help="Railway service name to update (default: night)",
    )
    args = parser.parse_args()

    if shutil.which("railway") is None:
        print("railway CLI is required but not found in PATH.", file=sys.stderr)
        return 1

    env_values = parse_env_file(args.env_file)
    if not env_values:
        print(f"No environment variables found in {args.env_file}")
        return 0

    items = list(env_values.items())
    for chunk in chunk_pairs(items):
        cmd = ["railway", "variables", "--service", args.service, "--skip-deploys"]
        pretty_keys = ", ".join(key for key, _ in chunk)
        for key, value in chunk:
            cmd.extend(["--set", f"{key}={value}"])
        print(f"Setting [{pretty_keys}] on service {args.service}")
        subprocess.run(cmd, check=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
