import os
import pytest
from backend.services.exam_service import audit_exam_from_pdf, parse_exam_from_pdf_bytes


def test_full_cs101_mock_exam_audit():
    pdf_path = "CS101_Programming_Midterm_Exam.pdf"
    if not os.path.exists(pdf_path):
        pytest.skip(f"{pdf_path} not found in workspace")

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    # Stage A: Parse
    parse_res = parse_exam_from_pdf_bytes(pdf_bytes, filename=pdf_path)
    assert parse_res.page_count >= 1
    assert parse_res.is_scanned_pdf is False
    assert len(parse_res.questions) == 12
    # Verify answer keys were extracted
    assert len(parse_res.detected_keys) == 12

    # Stage B-G: Audit
    audit_res = audit_exam_from_pdf(pdf_bytes, filename=pdf_path, seed=42)
    assert audit_res.total_questions == 12
    assert audit_res.mcq_count == 8
    assert audit_res.tf_count == 4
    assert audit_res.evaluated_questions == 12
    assert audit_res.correct_predictions > 0
    assert audit_res.accuracy is not None
    # Verify baseline is around (8*0.25 + 4*0.5)/12 = (2 + 2)/12 = 33.3%
    assert 30.0 <= audit_res.expected_random_baseline <= 35.0
    assert len(audit_res.questions) == 12
    assert audit_res.verdict_stamp in ["LEAKY EXAM", "MODERATE RISK", "ROBUST EXAM"]
