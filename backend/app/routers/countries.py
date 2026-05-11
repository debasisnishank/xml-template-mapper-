from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/countries", tags=["countries"])


class Country(BaseModel):
    code: str
    name: str


# Seed list for the POC. Extend or load from config as needed.
_COUNTRIES: list[Country] = [
    Country(code="BE", name="Belgium"),
    Country(code="DE", name="Germany"),
    Country(code="FR", name="France"),
    Country(code="IT", name="Italy"),
    Country(code="NL", name="Netherlands"),
    Country(code="ES", name="Spain"),
    Country(code="GB", name="United Kingdom"),
    Country(code="IN", name="India"),
    Country(code="US", name="United States"),
]


@router.get("", response_model=list[Country])
def list_countries() -> list[Country]:
    return _COUNTRIES
