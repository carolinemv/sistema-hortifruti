from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Product, StockMovement
from ..schemas import ProductCreate, ProductUpdate, Product as ProductSchema, StockMovementCreate, StockMovement as StockMovementSchema
from ..auth import get_current_active_user, get_current_admin_user
from ..models import User

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[ProductSchema], dependencies=[Depends(get_current_active_user)])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    products = db.query(Product).options(joinedload(Product.supplier)).filter(Product.is_active == True).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductSchema, dependencies=[Depends(get_current_active_user)])
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    db_product = db.query(Product).options(joinedload(Product.supplier)).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.post("/", response_model=ProductSchema, status_code=201, dependencies=[Depends(get_current_admin_user)])
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductSchema, dependencies=[Depends(get_current_admin_user)])
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=204, dependencies=[Depends(get_current_admin_user)])
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_active = False
    db.commit()
    return

@router.post("/{product_id}/stock-movement", response_model=StockMovementSchema, dependencies=[Depends(get_current_admin_user)])
async def create_stock_movement(
    product_id: int,
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_movement = StockMovement(**movement.dict(), product_id=product_id, user_id=current_user.id)
    db.add(db_movement)

    if movement.movement_type == "entrada":
        product.stock_quantity += movement.quantity
    elif movement.movement_type == "saída":
        if product.stock_quantity < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.stock_quantity -= movement.quantity
    
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.get("/{product_id}/stock-movements", response_model=List[StockMovementSchema], dependencies=[Depends(get_current_admin_user)])
async def get_product_stock_movements(
    product_id: int,
    db: Session = Depends(get_db)
):
    movements = db.query(StockMovement).filter(StockMovement.product_id == product_id).all()
    return movements 