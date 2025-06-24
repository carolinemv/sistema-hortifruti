from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from ..database import get_db
from ..models import Sale, SaleItem, Product, Customer, User, AccountReceivable
from ..schemas import SaleCreate, SaleUpdate, Sale as SaleSchema
from ..auth import get_current_active_user
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/sales",
    tags=["sales"],
    dependencies=[Depends(get_current_active_user)], # Todos os usuários ativos podem acessar
)

@router.get("/", response_model=List[SaleSchema])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    customer_name: Optional[str] = None,
    seller_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Sale).options(
        joinedload(Sale.seller), 
        joinedload(Sale.customer),
        joinedload(Sale.items).joinedload(SaleItem.product)
    )
    
    if customer_name:
        query = query.join(Customer).filter(Customer.name.ilike(f"%{customer_name}%"))
    
    if seller_id and current_user.role == "admin":
        query = query.filter(Sale.seller_id == seller_id)
    
    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    
    if end_date:
        query = query.filter(Sale.created_at <= end_date + " 23:59:59")
    
    if current_user.role == "admin":
        sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    else: # Vendedor
        sales = query.filter(Sale.seller_id == current_user.id).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales

@router.get("/grouped-by-customer")
async def get_sales_grouped_by_customer(
    customer_name: Optional[str] = None,
    seller_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna vendas agrupadas por cliente com filtros"""
    from sqlalchemy import func
    
    # Query base
    query = db.query(
        Customer.id,
        Customer.name,
        Customer.cpf,
        func.count(Sale.id).label('sales_count'),
        func.sum(Sale.total_amount).label('total_amount'),
        func.avg(Sale.total_amount).label('avg_amount')
    ).join(Sale, Customer.id == Sale.customer_id)
    
    # Aplicar filtros
    if customer_name:
        query = query.filter(Customer.name.ilike(f"%{customer_name}%"))
    
    # Filtro por vendedor - apenas admins podem filtrar por outros vendedores
    if seller_id and current_user.role == "admin":
        try:
            seller_id_int = int(seller_id)
            query = query.filter(Sale.seller_id == seller_id_int)
        except ValueError:
            pass  # Ignora se não for um número válido
    elif current_user.role != "admin":
        # Vendedores só veem suas próprias vendas
        query = query.filter(Sale.seller_id == current_user.id)
    
    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    
    if end_date:
        query = query.filter(Sale.created_at <= end_date + " 23:59:59")
    
    if status:
        query = query.filter(Sale.status == status)
    
    # Agrupar e ordenar
    grouped_sales = query.group_by(Customer.id, Customer.name, Customer.cpf)\
        .order_by(func.sum(Sale.total_amount).desc()).all()
    
    # Buscar detalhes das vendas para cada cliente
    result = []
    for group in grouped_sales:
        # Buscar vendas detalhadas para este cliente
        sales_query = db.query(Sale).options(
            joinedload(Sale.seller),
            joinedload(Sale.items).joinedload(SaleItem.product)
        ).filter(Sale.customer_id == group.id)
        
        # Aplicar mesmos filtros
        if seller_id and current_user.role == "admin":
            try:
                seller_id_int = int(seller_id)
                sales_query = sales_query.filter(Sale.seller_id == seller_id_int)
            except ValueError:
                pass
        elif current_user.role != "admin":
            # Vendedores só veem suas próprias vendas
            sales_query = sales_query.filter(Sale.seller_id == current_user.id)
        
        if start_date:
            sales_query = sales_query.filter(Sale.created_at >= start_date)
        
        if end_date:
            sales_query = sales_query.filter(Sale.created_at <= end_date + " 23:59:59")
        
        if status:
            sales_query = sales_query.filter(Sale.status == status)
        
        sales = sales_query.order_by(Sale.created_at.desc()).all()
        
        # Calcular estatísticas por status
        status_stats = {}
        for sale in sales:
            status = sale.status
            if status not in status_stats:
                status_stats[status] = {"count": 0, "amount": 0}
            status_stats[status]["count"] += 1
            status_stats[status]["amount"] += sale.total_amount
        
        result.append({
            "customer": {
                "id": group.id,
                "name": group.name,
                "cpf": group.cpf
            },
            "summary": {
                "sales_count": group.sales_count,
                "total_amount": float(group.total_amount),
                "avg_amount": float(group.avg_amount),
                "status_stats": status_stats
            },
            "sales": [
                {
                    "id": sale.id,
                    "total_amount": sale.total_amount,
                    "payment_method": sale.payment_method,
                    "status": sale.status,
                    "created_at": sale.created_at,
                    "seller": {
                        "id": sale.seller.id,
                        "name": sale.seller.name
                    } if sale.seller else None,
                    "items": [
                        {
                            "product_name": item.product.name,
                            "quantity": item.quantity,
                            "unit_price": item.unit_price,
                            "total_price": item.total_price
                        }
                        for item in sale.items
                    ]
                }
                for sale in sales
            ]
        })
    
    return result 

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

    # Definir status da venda
    sale_status = "completed"
    paid_at = None
    if sale.payment_method.lower() in ["fiado", "credito", "a prazo"]:
        sale_status = "pending"
    else:
        paid_at = datetime.now()

    db_sale = Sale(
        seller_id=current_user.id,
        customer_id=sale.customer_id,
        payment_method=sale.payment_method,
        total_amount=total_amount,
        status=sale_status,
        items=sale_items_to_create,
        paid_at=paid_at
    )
    
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    
    # Se o pagamento for "fiado", criar uma conta a receber
    if sale.payment_method.lower() in ["fiado", "credito", "a prazo"]:
        # Usar data de vencimento fornecida ou padrão de 30 dias
        if hasattr(sale, 'due_date') and sale.due_date:
            due_date = datetime.fromisoformat(sale.due_date.replace('Z', '+00:00'))
        else:
            due_date = datetime.now() + timedelta(days=30)
        
        account_receivable = AccountReceivable(
            sale_id=db_sale.id,
            customer_id=sale.customer_id,
            amount=total_amount,
            due_date=due_date,
            notes=f"Fiado da venda #{db_sale.id}",
            status="pending"
        )
        
        db.add(account_receivable)
        db.commit()
    
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