from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product, StockMovement
from ..schemas import ProductCreate, ProductUpdate, Product as ProductSchema, StockMovementCreate, StockMovement as StockMovementSchema
from ..auth import get_current_active_user, get_current_admin_user
from ..models import User

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductSchema])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    products = db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductSchema)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for field, value in product.dict(exclude_unset=True).items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_active = False
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/stock-movement", response_model=StockMovementSchema)
async def create_stock_movement(
    product_id: int,
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create stock movement
    db_movement = StockMovement(
        product_id=product_id,
        user_id=current_user.id,
        **movement.dict()
    )
    db.add(db_movement)
    
    # Update product stock
    if movement.movement_type == "entrada":
        product.stock_quantity += movement.quantity
    elif movement.movement_type == "saída":
        if product.stock_quantity < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.stock_quantity -= movement.quantity
    elif movement.movement_type == "ajuste":
        product.stock_quantity = movement.quantity
    
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.get("/{product_id}/stock-movements", response_model=List[StockMovementSchema])
async def get_product_stock_movements(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    movements = db.query(StockMovement).filter(StockMovement.product_id == product_id).all()
    return movements 