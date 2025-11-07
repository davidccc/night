from __future__ import annotations

import argparse
import re
import shutil
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable, List

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.text import slugify

from api.models import Location, Sweet

try:  # pragma: no cover - optional dependency guard
    from pypinyin import lazy_pinyin
except ImportError:  # pragma: no cover - fallback when pypinyin not installed
    lazy_pinyin = None


try:
    import pytesseract  # type: ignore
    from PIL import Image  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    pytesseract = None  # type: ignore
    Image = None  # type: ignore


LOCATION_INFO: dict[str, tuple[str, str]] = {
    "台北": ("taipei", "台北"),
    "新北": ("newtaipei", "新北"),
    "桃園": ("taoyuan", "桃園"),
    "台中": ("taichung", "台中"),
    "台南": ("tainan", "台南"),
    "高雄": ("kaohsiung", "高雄"),
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

FIELD_MAP = {
    "國別": "nationality",
    "國籍": "nationality",
    "年齡": "age_text",
    "身高": "height_cm",
    "體重": "weight_kg",
    "罩杯": "cup",
    "環境": "environment",
    "長鍾": "long_duration_minutes",
    "長鐘": "long_duration_minutes",
    "短鍾": "short_duration_minutes",
    "短鐘": "short_duration_minutes",
    "類型": "service_type",
    "定點長鐘": "long_price",
    "長鐘費用": "long_price",
    "定點長鍾": "long_price",
    "定點短鐘": "short_price",
    "短鐘費用": "short_price",
    "定點短鍾": "short_price",
}


def parse_entries(text: str) -> Iterable[dict[str, str]]:
    normalized = text.replace("：", ":")
    blocks = [block.strip() for block in normalized.split("\n\n") if block.strip()]
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        entry: dict[str, str] = {"name": lines[0]}
        for raw in lines[1:]:
            if ":" not in raw:
                continue
            key, value = raw.split(":", 1)
            key = key.strip()
            value = value.strip()
            mapped = FIELD_MAP.get(key)
            if mapped:
                entry[mapped] = value
            else:
                entry[key] = value
        entry["raw_description"] = "\n".join(lines[1:])
        yield entry


def safe_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKC", name or "").strip()
    if not normalized:
        return "sweet"

    def _cleanup(value: str) -> str:
        return re.sub(r"[^0-9A-Za-z]", "", value)

    if lazy_pinyin:
        pinyin_parts = lazy_pinyin(normalized, errors=lambda value: _cleanup(value))
        slug = "".join(_cleanup(part) for part in pinyin_parts).lower()
        if slug:
            return slug

    slug = slugify(normalized, allow_unicode=False).replace("-", "")
    if slug:
        return slug

    fallback = _cleanup(normalized).lower()
    return fallback or "sweet"


def parse_int(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"\d+", value)
    if not match:
        return None
    try:
        return int(match.group())
    except ValueError:  # pragma: no cover - defensive
        return None


def select_image(name: str, images: List[Path]) -> Path | None:
    if not images:
        return None

    target = normalize_text(name)
    if target:
        best_idx = None
        best_score = 0.0
        for idx, candidate in enumerate(images):
            normalized_stem = normalize_text(candidate.stem)
            if not normalized_stem:
                continue
            if normalized_stem == target:
                return images.pop(idx)
            score = SequenceMatcher(None, target, normalized_stem).ratio()
            if score > best_score:
                best_score = score
                best_idx = idx
        if best_idx is not None and best_score >= 0.6:
            return images.pop(best_idx)

    ocr_idx = match_image_by_ocr(name, images)
    if ocr_idx is not None:
        return images.pop(ocr_idx)

    return images.pop(0)


def match_image_by_ocr(name: str, images: List[Path]) -> int | None:
    if not pytesseract or not Image:
        return None

    target = normalize_text(name)
    if not target:
        return None

    best_idx: int | None = None
    best_score = 0.0

    for idx, candidate in enumerate(images):
        try:
            with Image.open(candidate) as img:
                text = pytesseract.image_to_string(img, lang="chi_tra+eng")
        except Exception:
            continue

        normalized = normalize_text(text)
        if not normalized:
            continue

        if target in normalized:
            return idx

        score = SequenceMatcher(None, target, normalized).ratio()
        if score > best_score:
            best_score = score
            best_idx = idx

    if best_idx is not None and best_score >= 0.45:
        return best_idx
    return None


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKC", value)
    normalized = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]", "", normalized)
    return normalized.lower()


class Command(BaseCommand):
    help = "Import sweet profiles from resource text files and images."

    def add_arguments(self, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "--source-dir",
            type=str,
            default=str(Path("res").resolve()),
            help="Directory containing location folders with text and images.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and report results without modifying the database or copying images.",
        )

    def handle(self, *args, **options):
        source_dir = Path(options["source_dir"]).resolve()
        dry_run: bool = options["dry_run"]

        if not source_dir.exists():
            raise CommandError(f"Source directory {source_dir} does not exist.")

        repo_root = Path(__file__).resolve().parents[5]
        public_root = repo_root / "apps" / "web" / "public" / "sweets"
        public_root.mkdir(parents=True, exist_ok=True)

        imported: List[str] = []
        unmatched: List[str] = []

        location_dirs = sorted(p for p in source_dir.iterdir() if p.is_dir())
        total_locations = len(location_dirs)
        for location_index, location_dir in enumerate(location_dirs, start=1):
            self.stdout.write(f"[匯入] 地區 {location_dir.name} ({location_index}/{total_locations})")
            location_key = location_dir.name.strip()
            slug, display_name = LOCATION_INFO.get(location_key, (safe_slug(location_key), location_key))

            location, _ = Location.objects.get_or_create(slug=slug, defaults={"name": display_name})

            text_files = list(location_dir.glob("*.txt"))
            if not text_files:
                self.stdout.write(self.style.WARNING(f"[匯入] {location_dir} 無文字檔，跳過"))
                continue

            text_content = "\n\n".join(file.read_text(encoding="utf-8") for file in text_files)
            entries = list(parse_entries(text_content))
            if not entries:
                self.stdout.write(self.style.WARNING(f"[匯入] {location_dir} 文字格式無法解析，跳過"))
                continue

            image_queue: List[Path] = sorted(
                [p for p in location_dir.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS]
            )

            location_public_dir = public_root / slug
            location_public_dir.mkdir(parents=True, exist_ok=True)

            for idx, entry in enumerate(entries, start=1):
                name = entry["name"]
                ascii_slug = safe_slug(name)
                before = len(image_queue)
                image_path = select_image(name, image_queue)
                after = len(image_queue)
                if image_path is not None and before == after:
                    self.stdout.write(self.style.WARNING(f"[匯入] {name} 圖片配對異常，仍保留於佇列"))

                dest_relative = None
                if image_path is not None:
                    dest_filename = f"{ascii_slug}{image_path.suffix.lower() or '.jpg'}"
                    dest_path = location_public_dir / dest_filename
                    dest_relative = f"/sweets/{slug}/{dest_filename}"
                    if not dry_run:
                        shutil.copy2(image_path, dest_path)
                    self.stdout.write(f"[匯入] {display_name}-{name} 圖片已儲存為 {dest_filename}")
                else:
                    self.stdout.write(self.style.WARNING(f"[匯入] {name} 在 {location_dir} 無對應圖片"))
                    unmatched.append(name)

                description = entry.get("raw_description", "")
                nationality = entry.get("nationality", "")
                age_text = entry.get("age_text", "")
                height_cm = parse_int(entry.get("height_cm"))
                weight_kg = parse_int(entry.get("weight_kg"))
                cup = entry.get("cup", "")
                environment = entry.get("environment", "")
                long_duration = parse_int(entry.get("long_duration_minutes"))
                short_duration = parse_int(entry.get("short_duration_minutes"))
                service_type = entry.get("service_type", "")
                long_price = parse_int(entry.get("long_price"))
                short_price = parse_int(entry.get("short_price"))
                tag_parts = [display_name, service_type, nationality]
                tag = " ".join(part for part in tag_parts if part)

                defaults = {
                    "description": description,
                    "image_url": dest_relative or "",
                    "tag": tag,
                    "nationality": nationality,
                    "age_text": age_text,
                    "height_cm": height_cm,
                    "weight_kg": weight_kg,
                    "cup": cup,
                    "environment": environment,
                    "long_duration_minutes": long_duration,
                    "short_duration_minutes": short_duration,
                    "service_type": service_type,
                    "long_price": long_price,
                    "short_price": short_price,
                    "update_time": timezone.now(),
                }

                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] {display_name} / {name}: image={dest_relative or 'N/A'} "
                        f"height={height_cm} weight={weight_kg} prices=({long_price}/{short_price})"
                    )
                else:
                    Sweet.objects.update_or_create(
                        name=name,
                        location=location,
                        defaults=defaults,
                    )
                imported.append(f"{display_name}-{name}")

        if unmatched:
            missing = ", ".join(unmatched)
            self.stdout.write(self.style.WARNING(f"[匯入] 以下甜心無對應圖片：{missing}"))
        self.stdout.write(self.style.SUCCESS(f"Processed {len(imported)} sweet profiles."))

        self.stdout.write(self.style.SUCCESS(f"Processed {len(imported)} sweet profiles."))
