from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from ..database import get_db
from ..models import Sale, SaleItem, Product, Customer, User
from ..schemas import SaleCreate, SaleUpdate, Sale as SaleSchema
from ..auth import get_current_active_user

router = APIRouter(
    prefix="/sales",
    tags=["sales"],
    dependencies=[Depends(get_current_active_user)], # Todos os usuários ativos podem acessar
)

@router.get("/", response_model=List[SaleSchema])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Sale).options(
        joinedload(Sale.seller), 
        joinedload(Sale.customer),
        joinedload(Sale.items).joinedload(SaleItem.product)
    )
    
    if current_user.role == "admin":
        sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    else: # Vendedor
        sales = query.filter(Sale.seller_id == current_user.id).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleSchema)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_sale = db.query(Sale).options(
        joinedload(Sale.seller), 
        joinedload(Sale.customer),
        joinedload(Sale.items).joinedload(SaleItem.product)
    ).filter(Sale.id == sale_id).first()
    if db_sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    if current_user.role != "admin" and db_sale.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this sale")
        
    return db_sale

@router.post("/", response_model=SaleSchema, status_code=201)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    total_amount = 0
    sale_items_to_create = []
    
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        
        item_total = product.price * item.quantity
        total_amount += item_total
        
        sale_items_to_create.append(SaleItem(
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=product.price,
            total_price=item_total
        ))
        
        product.stock_quantity -= item.quantity

    db_sale = Sale(
        seller_id=current_user.id,
        customer_id=sale.customer_id,
        payment_method=sale.payment_method,
        total_amount=total_amount,
        items=sale_items_to_create
    )
    
    db.add(db_sale)
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