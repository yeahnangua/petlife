from __future__ import annotations

import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


BASE_DIR = Path(__file__).resolve().parents[1]
DOCX_PATH = BASE_DIR / "大作业报告.docx"
BACKUP_DIR = BASE_DIR / "work" / "backups"

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

EMU_PER_INCH = 914400
TARGET_WIDTH_IN = 4.2
SOURCE_WIDTH_PX = 430
SOURCE_HEIGHT_PX = 932


def main() -> None:
    if not DOCX_PATH.exists():
        raise FileNotFoundError(DOCX_PATH)

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / "大作业报告.before-mobile-resize.docx"
    shutil.copy2(DOCX_PATH, backup_path)

    target_cx = round(TARGET_WIDTH_IN * EMU_PER_INCH)
    target_cy = round(target_cx * SOURCE_HEIGHT_PX / SOURCE_WIDTH_PX)

    with TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir) / DOCX_PATH.name
        with ZipFile(DOCX_PATH, "r") as src, ZipFile(tmp_path, "w", ZIP_DEFLATED) as dst:
            for item in src.infolist():
                data = src.read(item.filename)
                if item.filename == "word/document.xml":
                    root = ET.fromstring(data)
                    drawings = root.findall(".//w:drawing", NS)
                    if len(drawings) < 11:
                        raise RuntimeError(f"Expected at least 11 drawings, found {len(drawings)}")

                    for drawing in drawings[6:11]:
                        wp_extent = drawing.find(".//wp:extent", NS)
                        if wp_extent is None:
                            raise RuntimeError("Drawing missing wp:extent")
                        wp_extent.set("cx", str(target_cx))
                        wp_extent.set("cy", str(target_cy))

                        for a_extent in drawing.findall(".//a:xfrm/a:ext", NS):
                            a_extent.set("cx", str(target_cx))
                            a_extent.set("cy", str(target_cy))

                    data = ET.tostring(root, encoding="utf-8", xml_declaration=True)
                dst.writestr(item, data)

        shutil.move(tmp_path, DOCX_PATH)

    print(DOCX_PATH)
    print(backup_path)
    print(f"{target_cx} x {target_cy} EMU")


if __name__ == "__main__":
    main()
