from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import countries, templates, verify, xml_parser

app = FastAPI(
    title="XML Template Mapper API",
    version="0.1.0",
    description="Backend for the XML Template Mapper POC.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(countries.router)
app.include_router(templates.router)
app.include_router(xml_parser.router)
app.include_router(verify.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
