from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Sale, SaleItem, Product, Customer, User
from ..schemas import SaleCreate, SaleUpdate, Sale as SaleSchema
from ..auth import get_current_active_user

router = APIRouter(prefix="/sales", tags=["sales"])

@router.get("/", response_model=List[SaleSchema])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sales = db.query(Sale).offset(skip).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleSchema)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.post("/", response_model=SaleSchema)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Create sale
    db_sale = Sale(
        customer_id=sale.customer_id,
        user_id=current_user.id,
        total_amount=sale.total_amount,
        payment_method=sale.payment_method,
        status=sale.status
    )
    db.add(db_sale)
    db.flush()  # Get the sale ID
    
    # Create sale items and update stock
    for item in sale.items:
        # Verify product exists and has enough stock
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")
        
        # Create sale item
        db_item = SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        db.add(db_item)
        
        # Update product stock
        product.stock_quantity -= item.quantity
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.put("/{sale_id}", response_model=SaleSchema)
async def update_sale(
    sale_id: int,
    sale: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if db_sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    for field, value in sale.dict(exclude_unset=True).items():
        setattr(db_sale, field, value)
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/daily-summary")
async def get_daily_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from sqlalchemy import func
    from datetime import datetime, date
    
    today = date.today()
    
    # Total sales today
    daily_sales = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.created_at) == today
    ).scalar() or 0
    
    # Number of sales today
    daily_count = db.query(func.count(Sale.id)).filter(
        func.date(Sale.created_at) == today
    ).scalar() or 0
    
    # Sales by payment method
    payment_methods = db.query(
        Sale.payment_method,
        func.sum(Sale.total_amount).label('total'),
        func.count(Sale.id).label('count')
    ).filter(
        func.date(Sale.created_at) == today
    ).group_by(Sale.payment_method).all()
    
    return {
        "date": today.isoformat(),
        "total_sales": float(daily_sales),
        "total_count": daily_count,
        "payment_methods": [
            {
                "method": pm.payment_method,
                "total": float(pm.total),
                "count": pm.count
            }
            for pm in payment_methods
        ]
    } 