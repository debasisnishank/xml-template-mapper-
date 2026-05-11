from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..models.template import VerificationResult
from ..services import storage
from ..services.verifier import verify
from ..services.xml_service import parse_xml

router = APIRouter(prefix="/api/verify", tags=["verify"])

_MAX_BYTES = 10 * 1024 * 1024


@router.post("", response_model=VerificationResult)
async def verify_template(
    template_id: str = Form(...),
    file: UploadFile = File(...),
) -> VerificationResult:
    template = storage.get_template(template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="File must have an .xml extension")

    content = await file.read()
    if len(content) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="XML file exceeds 10 MB limit")
    if not content.strip():
        raise HTTPException(status_code=400, detail="XML file is empty")

    try:
        parsed = parse_xml(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return verify(template, parsed)
