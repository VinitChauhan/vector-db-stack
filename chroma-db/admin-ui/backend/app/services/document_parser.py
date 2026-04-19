from __future__ import annotations

from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from typing import List
import csv
import json
import logging

logger = logging.getLogger(__name__)

SUPPORTED_UPLOAD_TYPES = {
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".html",
    ".htm",
    ".pdf",
    ".docx",
}


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())

    def text(self) -> str:
        return "\n".join(self.parts)


def parse_document_bytes(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_UPLOAD_TYPES:
        raise ValueError(
            f"Unsupported file type '{extension or 'unknown'}'. "
            f"Supported types: {', '.join(sorted(SUPPORTED_UPLOAD_TYPES))}"
        )

    if extension in {".txt", ".md"}:
        return content.decode("utf-8", errors="ignore").strip()
    if extension == ".csv":
        return _parse_csv(content)
    if extension == ".json":
        return _parse_json(content)
    if extension in {".html", ".htm"}:
        return _parse_html(content)
    if extension == ".pdf":
        return _parse_pdf(content)
    if extension == ".docx":
        return _parse_docx(content)

    raise ValueError(f"No parser implemented for '{extension}'")


def chunk_text(text: str, chunk_size: int = 1200, chunk_overlap: int = 150) -> List[str]:
    cleaned = text.strip()
    if not cleaned:
        return []

    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks: List[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        if end < len(cleaned):
            split_at = cleaned.rfind("\n", start, end)
            if split_at <= start:
                split_at = cleaned.rfind(" ", start, end)
            if split_at > start:
                end = split_at

        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(cleaned):
            break
        start = max(end - chunk_overlap, start + 1)

    return chunks


def _parse_csv(content: bytes) -> str:
    decoded = content.decode("utf-8", errors="ignore")
    rows = list(csv.reader(decoded.splitlines()))
    return "\n".join(", ".join(cell.strip() for cell in row if cell.strip()) for row in rows).strip()


def _parse_json(content: bytes) -> str:
    parsed = json.loads(content.decode("utf-8", errors="ignore"))
    return json.dumps(parsed, indent=2, ensure_ascii=True)


def _parse_html(content: bytes) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(content.decode("utf-8", errors="ignore"))
    return parser.text().strip()


def _parse_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF upload requires the 'pypdf' package") from exc

    reader = PdfReader(BytesIO(content))
    text_parts = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n\n".join(part for part in text_parts if part).strip()


def _parse_docx(content: bytes) -> str:
    try:
        from docx import Document
    except ImportError as exc:
        raise RuntimeError("DOCX upload requires the 'python-docx' package") from exc

    document = Document(BytesIO(content))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs).strip()
