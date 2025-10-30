import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from app.api.deps import SessionDep, CurrentUser
from app.api.dto import Message
from app.core.config import settings
from app.repositories.occupancy_map_repository import OccupancyMapRepository
from app.schemas import OccupancyMapsPublic, OccupancyMapPublic, OccupancyMapCreate, OccupancyMapUpdate

router = APIRouter(prefix="/occupancy_map", tags=["occupancy_map"])


@router.get("/", response_model=OccupancyMapsPublic)
async def get_occupancy_maps(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> OccupancyMapsPublic:
    """
    Get occupancy maps
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    return occupancy_map_repo.get_by_owner(current_user.id, skip, limit)


@router.get("/{id}", response_model=OccupancyMapPublic)
async def get_occupancy_map(
    session: SessionDep, current_user: CurrentUser, id: UUID
) -> OccupancyMapPublic:
    """
    Get occupancy map by ID
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    occupancy_map = occupancy_map_repo.get_by_id(id)

    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    return occupancy_map


@router.post("/", response_model=OccupancyMapPublic)
async def create_occupancy_map(
    session: SessionDep,
    current_user: CurrentUser,
    name: str = Form(...),
    pgm_file: UploadFile = File(...),
    yaml_file: UploadFile = File(...),
) -> OccupancyMapPublic:
    """
    Create occupancy map with file uploads
    """
    occupancy_map_repo = OccupancyMapRepository(session)

    # Check if occupancy map with the same name already exists
    exist = occupancy_map_repo.get_by_name(name, current_user.id)
    if exist:
        raise HTTPException(status_code=400, detail="occupancy map already exists")

    # Validate file extensions
    if not pgm_file.filename or not pgm_file.filename.endswith('.pgm'):
        raise HTTPException(status_code=400, detail="PGM file must have .pgm extension")
    if not yaml_file.filename or not yaml_file.filename.endswith('.yaml'):
        raise HTTPException(status_code=400, detail="YAML file must have .yaml extension")

    # Create directory structure: {OCCUPANCY_MAPS_DIR}/{user_id}/{map_name}/
    map_dir = Path(settings.OCCUPANCY_MAPS_DIR) / str(current_user.id) / name
    map_dir.mkdir(parents=True, exist_ok=True)

    # Save files
    pgm_path = map_dir / pgm_file.filename
    yaml_path = map_dir / yaml_file.filename

    try:
        # Save PGM file
        with pgm_path.open("wb") as buffer:
            shutil.copyfileobj(pgm_file.file, buffer)

        # Save YAML file
        with yaml_path.open("wb") as buffer:
            shutil.copyfileobj(yaml_file.file, buffer)

        # Create database entry
        occupancy_map_create = OccupancyMapCreate(
            name=name,
            pgm_file_path=str(pgm_path),
            yaml_file_path=str(yaml_path),
        )

        return occupancy_map_repo.create(occupancy_map_create, owner_id=current_user.id)

    except Exception as e:
        # Clean up files if database operation fails
        if pgm_path.exists():
            pgm_path.unlink()
        if yaml_path.exists():
            yaml_path.unlink()
        # Remove directory if empty
        try:
            map_dir.rmdir()
        except OSError:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create occupancy map: {str(e)}")


@router.get("/{id}/pgm")
async def get_occupancy_map_pgm(
    session: SessionDep, current_user: CurrentUser, id: UUID
) -> FileResponse:
    """
    Get PGM file of occupancy map
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    occupancy_map = occupancy_map_repo.get_by_id(id)

    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    pgm_path = Path(occupancy_map.pgm_file_path)
    if not pgm_path.exists():
        raise HTTPException(status_code=404, detail="PGM file not found")

    return FileResponse(
        path=str(pgm_path),
        media_type="application/octet-stream",
        filename=pgm_path.name
    )


@router.get("/{id}/yaml")
async def get_occupancy_map_yaml(
    session: SessionDep, current_user: CurrentUser, id: UUID
) -> FileResponse:
    """
    Get YAML file of occupancy map
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    occupancy_map = occupancy_map_repo.get_by_id(id)

    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    yaml_path = Path(occupancy_map.yaml_file_path)
    if not yaml_path.exists():
        raise HTTPException(status_code=404, detail="YAML file not found")

    return FileResponse(
        path=str(yaml_path),
        media_type="application/x-yaml",
        filename=yaml_path.name
    )


@router.get("/{id}/download")
async def download_occupancy_map(
    session: SessionDep, current_user: CurrentUser, id: UUID
) -> FileResponse:
    """
    Download occupancy map as ZIP file containing both PGM and YAML files
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    occupancy_map = occupancy_map_repo.get_by_id(id)

    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    pgm_path = Path(occupancy_map.pgm_file_path)
    yaml_path = Path(occupancy_map.yaml_file_path)

    if not pgm_path.exists():
        raise HTTPException(status_code=404, detail="PGM file not found")
    if not yaml_path.exists():
        raise HTTPException(status_code=404, detail="YAML file not found")

    # Create a temporary ZIP file
    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
    try:
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(pgm_path, arcname=pgm_path.name)
            zipf.write(yaml_path, arcname=yaml_path.name)

        zip_filename = f"{occupancy_map.name}.zip"

        return FileResponse(
            path=temp_zip.name,
            media_type="application/zip",
            filename=zip_filename,
            background=None  # File will be deleted after response
        )
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_zip.name):
            os.unlink(temp_zip.name)
        raise HTTPException(status_code=500, detail=f"Failed to create ZIP file: {str(e)}")


@router.put("/{id}", response_model=OccupancyMapPublic)
async def update_occupancy_map(
    session: SessionDep, current_user: CurrentUser, id: UUID, occupancy_map_in: OccupancyMapUpdate
) -> OccupancyMapPublic:
    """
    Update occupancy map
    """
    occupancy_map_repo = OccupancyMapRepository(session)

    # Check if the occupancy map is owned by user
    occupancy_map = occupancy_map_repo.get_by_id(id)
    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    return occupancy_map_repo.update(occupancy_map, occupancy_map_in)


@router.delete("/{id}")
async def delete_occupancy_map(
    session: SessionDep, current_user: CurrentUser, id: UUID
) -> Message:
    """
    Delete occupancy map
    """
    occupancy_map_repo = OccupancyMapRepository(session)
    occupancy_map = occupancy_map_repo.get_by_id(id)
    if occupancy_map is None:
        raise HTTPException(status_code=404, detail="occupancy map does not exist")
    if occupancy_map.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="unauthorized")

    occupancy_map_repo.delete(occupancy_map.id)

    return Message(message="Occupancy map deleted successfully")
