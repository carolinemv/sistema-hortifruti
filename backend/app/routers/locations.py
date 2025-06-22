from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Location, ProductLocation, Product, Supplier
from ..schemas import LocationCreate, LocationUpdate, Location as LocationSchema, ProductLocationCreate, ProductLocation as ProductLocationSchema, ProductLocationUpdate
from ..auth import get_current_active_user, get_current_admin_user
from ..models import User

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[LocationSchema])
async def get_locations(
    skip: int = 0,
    limit: int = 100,
    location_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Location).filter(Location.is_active == True)
    
    if location_type:
        query = query.filter(Location.location_type == location_type)
    
    locations = query.offset(skip).limit(limit).all()
    return locations

@router.get("/{location_id}", response_model=LocationSchema)
async def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.post("/", response_model=LocationSchema, status_code=201)
async def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_location = Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.put("/{location_id}", response_model=LocationSchema)
async def update_location(
    location_id: int,
    location_update: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_location, key, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db_location.is_active = False
    db.commit()
    return

# Product Location endpoints (Estoque)
@router.get("/{location_id}/products", response_model=List[ProductLocationSchema])
async def get_location_products(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product_locations = db.query(ProductLocation).options(
        joinedload(ProductLocation.product).joinedload(Product.supplier),
        joinedload(ProductLocation.location)
    ).filter(
        ProductLocation.location_id == location_id
    ).all()
    return product_locations

@router.post("/{location_id}/products", response_model=ProductLocationSchema, status_code=201)
async def add_product_to_location(
    location_id: int,
    product_location: ProductLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Verificar se a localização existe
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Verificar se o produto existe
    product = db.query(Product).filter(Product.id == product_location.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verificar se já existe um registro para este produto nesta localização
    existing = db.query(ProductLocation).filter(
        ProductLocation.product_id == product_location.product_id,
        ProductLocation.location_id == location_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Product already exists in this location")
    
    db_product_location = ProductLocation(**product_location.dict(), location_id=location_id)
    db.add(db_product_location)
    db.commit()
    db.refresh(db_product_location)
    return db_product_location

@router.put("/{location_id}/products/{product_location_id}", response_model=ProductLocationSchema)
async def update_product_location(
    location_id: int,
    product_location_id: int,
    product_location_update: ProductLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_product_location = db.query(ProductLocation).filter(
        ProductLocation.id == product_location_id,
        ProductLocation.location_id == location_id
    ).first()
    
    if not db_product_location:
        raise HTTPException(status_code=404, detail="Product location not found")
    
    update_data = product_location_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product_location, key, value)
    
    db.commit()
    db.refresh(db_product_location)
    return db_product_location

@router.delete("/{location_id}/products/{product_location_id}", status_code=204)
async def remove_product_from_location(
    location_id: int,
    product_location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_product_location = db.query(ProductLocation).filter(
        ProductLocation.id == product_location_id,
        ProductLocation.location_id == location_id
    ).first()
    
    if not db_product_location:
        raise HTTPException(status_code=404, detail="Product location not found")
    
    db.delete(db_product_location)
    db.commit()
    return

# Estoque geral - visão consolidada
@router.get("/stock/overview")
async def get_stock_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna uma visão geral do estoque por localização"""
    stock_data = db.query(ProductLocation).options(
        joinedload(ProductLocation.product).joinedload(Product.supplier),
        joinedload(ProductLocation.location)
    ).all()
    
    # Agrupar por localização
    locations_stock = {}
    for item in stock_data:
        location_name = item.location.name
        if location_name not in locations_stock:
            locations_stock[location_name] = {
                "location": {
                    "id": item.location.id,
                    "name": item.location.name,
                    "type": item.location.location_type,
                    "temperature": item.location.temperature
                },
                "products": []
            }
        
        locations_stock[location_name]["products"].append({
            "id": item.product.id,
            "name": item.product.name,
            "supplier": item.product.supplier.name,
            "quantity": item.quantity,
            "min_quantity": item.min_quantity,
            "max_quantity": item.max_quantity,
            "unit": item.product.unit,
            "notes": item.notes
        })
    
    return list(locations_stock.values())

# Produtos com estoque baixo
@router.get("/stock/low-stock")
async def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna produtos com estoque abaixo do mínimo"""
    low_stock = db.query(ProductLocation).options(
        joinedload(ProductLocation.product).joinedload(Product.supplier),
        joinedload(ProductLocation.location)
    ).filter(
        ProductLocation.quantity <= ProductLocation.min_quantity,
        ProductLocation.min_quantity > 0
    ).all()
    
    return [
        {
            "product": {
                "id": item.product.id,
                "name": item.product.name,
                "supplier": item.product.supplier.name
            },
            "location": {
                "id": item.location.id,
                "name": item.location.name
            },
            "current_quantity": item.quantity,
            "min_quantity": item.min_quantity,
            "unit": item.product.unit
        }
        for item in low_stock
    ] 