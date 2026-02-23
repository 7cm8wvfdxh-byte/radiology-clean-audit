"""
DICOM → base64 JPEG dönüşüm yardımcıları.

Her DICOM dosyasından temsili dilimler seçilir,
normalize edilir ve Claude Vision API için base64'e çevrilir.
"""
from __future__ import annotations

import base64
import io
from typing import List

import numpy as np

try:
    import pydicom
    from pydicom.errors import InvalidDicomError
    PYDICOM_AVAILABLE = True
except ImportError:
    PYDICOM_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


MAX_IMAGE_SIDE = 1024  # pikselde maksimum kenar uzunluğu


def _normalize_frame(frame: np.ndarray) -> np.ndarray:
    """Piksel değerlerini 0-255 uint8'e normalize et."""
    frame = frame.astype(float)
    lo, hi = frame.min(), frame.max()
    if hi > lo:
        frame = (frame - lo) / (hi - lo) * 255.0
    else:
        frame[:] = 0
    return frame.astype(np.uint8)


def _frame_to_base64_jpeg(frame: np.ndarray) -> str:
    """NumPy 2D frame → base64 JPEG string."""
    img = Image.fromarray(frame).convert("RGB")
    # Büyük görüntüleri yeniden boyutlandır
    if max(img.size) > MAX_IMAGE_SIDE:
        img.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _select_indices(total: int, max_slices: int) -> List[int]:
    """Toplam dilimden eşit aralıklı max_slices adet index seç."""
    if total <= max_slices:
        return list(range(total))
    return list(np.linspace(0, total - 1, max_slices, dtype=int))


def _get_series_description(ds) -> str:
    """DICOM tag'lerinden seri açıklaması oluştur."""
    parts = []
    for tag in ("SeriesDescription", "ProtocolName", "ScanningSequence"):
        val = getattr(ds, tag, None)
        if val:
            parts.append(str(val).strip())
    modality = getattr(ds, "Modality", "MR")
    orientation = getattr(ds, "ImageOrientationPatient", None)
    if parts:
        return f"{modality} – {' / '.join(parts)}"
    return modality


def extract_images_from_dicom(
    file_bytes: bytes,
    max_slices: int = 4,
) -> List[dict]:
    """
    DICOM bytes'tan görüntü listesi çıkar.

    Returns:
        [{"base64": str, "series_description": str, "slice_info": str}, ...]
    """
    if not PYDICOM_AVAILABLE or not PIL_AVAILABLE:
        return []

    try:
        ds = pydicom.dcmread(io.BytesIO(file_bytes))
        pixel_array = ds.pixel_array
    except Exception:
        return []

    series_desc = _get_series_description(ds)

    # Tek dilim (2D)
    if pixel_array.ndim == 2:
        b64 = _frame_to_base64_jpeg(_normalize_frame(pixel_array))
        return [{"base64": b64, "series_description": series_desc, "slice_info": "1/1"}]

    # Çok dilimli (3D): [dilimsayısı, satır, sütun]
    n = pixel_array.shape[0]
    indices = _select_indices(n, max_slices)
    results = []
    for idx in indices:
        frame = _normalize_frame(pixel_array[idx])
        b64 = _frame_to_base64_jpeg(frame)
        results.append({
            "base64": b64,
            "series_description": series_desc,
            "slice_info": f"{idx + 1}/{n}",
        })
    return results
