from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.template import ParsedXml
from ..services.xml_service import parse_xml

router = APIRouter(prefix="/api/xml", tags=["xml"])

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB cap for the POC


@router.post("/parse", response_model=ParsedXml)
async def parse(file: UploadFile = File(...)) -> ParsedXml:
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="File must have an .xml extension")

    content = await file.read()
    if len(content) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="XML file exceeds 10 MB limit")
    if not content.strip():
        raise HTTPException(status_code=400, detail="XML file is empty")

    try:
        return parse_xml(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
