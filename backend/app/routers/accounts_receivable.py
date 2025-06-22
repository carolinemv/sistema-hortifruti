from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import AccountReceivable, Payment, Sale, Customer, User
from ..schemas import (
    AccountReceivableCreate, 
    AccountReceivableUpdate, 
    AccountReceivable as AccountReceivableSchema,
    PaymentCreate,
    Payment as PaymentSchema
)
from ..auth import get_current_active_user, get_current_admin_user
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/accounts-receivable",
    tags=["accounts-receivable"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[AccountReceivableSchema])
async def get_accounts_receivable(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(AccountReceivable).options(
        joinedload(AccountReceivable.sale),
        joinedload(AccountReceivable.customer)
    )
    
    if status:
        query = query.filter(AccountReceivable.status == status)
    
    if customer_name:
        query = query.join(Customer).filter(Customer.name.ilike(f"%{customer_name}%"))
    
    if current_user.role != "admin":
        # Vendedores só veem contas de vendas que eles fizeram
        query = query.join(Sale).filter(Sale.seller_id == current_user.id)
    
    accounts = query.order_by(AccountReceivable.due_date.asc()).offset(skip).limit(limit).all()
    return accounts

@router.get("/{account_id}", response_model=AccountReceivableSchema)
async def get_account_receivable(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    account = db.query(AccountReceivable).options(
        joinedload(AccountReceivable.sale),
        joinedload(AccountReceivable.customer)
    ).filter(AccountReceivable.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account receivable not found")
    
    if current_user.role != "admin":
        # Verificar se a venda foi feita pelo vendedor
        if account.sale.seller_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this account")
    
    return account

@router.post("/", response_model=AccountReceivableSchema, status_code=201)
async def create_account_receivable(
    account: AccountReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verificar se a venda existe
    sale = db.query(Sale).filter(Sale.id == account.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Verificar se a venda já tem uma conta a receber
    existing_account = db.query(AccountReceivable).filter(
        AccountReceivable.sale_id == account.sale_id
    ).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Sale already has an account receivable")
    
    # Criar a conta a receber
    db_account = AccountReceivable(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.put("/{account_id}", response_model=AccountReceivableSchema)
async def update_account_receivable(
    account_id: int,
    account_update: AccountReceivableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_account = db.query(AccountReceivable).filter(AccountReceivable.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account receivable not found")
    
    # Apenas admins podem atualizar contas a receber
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update accounts receivable")
    
    update_data = account_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_account, key, value)
    
    # Atualizar status baseado no valor pago
    if db_account.paid_amount >= db_account.amount:
        db_account.status = "paid"
    elif db_account.paid_amount > 0:
        db_account.status = "partial"
    elif db_account.due_date < datetime.now():
        db_account.status = "overdue"
    else:
        db_account.status = "pending"
    
    db.commit()
    db.refresh(db_account)
    return db_account

@router.post("/{account_id}/payments", response_model=PaymentSchema, status_code=201)
async def create_payment(
    account_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verificar se a conta a receber existe
    account = db.query(AccountReceivable).filter(AccountReceivable.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account receivable not found")
    
    # Verificar se o valor do pagamento não excede o valor restante
    remaining_amount = account.amount - account.paid_amount
    if payment.amount > remaining_amount:
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining balance")
    
    # Criar o pagamento (sem account_receivable_id no body, pois vem da URL)
    payment_data = payment.dict()
    payment_data.pop('account_receivable_id', None)  # Remove se existir no body
    
    db_payment = Payment(**payment_data, account_receivable_id=account_id, created_by=current_user.id)
    db.add(db_payment)
    
    # Atualizar o valor pago na conta
    account.paid_amount += payment.amount
    
    # Atualizar status da conta
    if account.paid_amount >= account.amount:
        account.status = "paid"
    else:
        account.status = "partial"
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/{account_id}/payments", response_model=List[PaymentSchema])
async def get_account_payments(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verificar se a conta a receber existe
    account = db.query(AccountReceivable).filter(AccountReceivable.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account receivable not found")
    
    payments = db.query(Payment).options(
        joinedload(Payment.user)
    ).filter(Payment.account_receivable_id == account_id).order_by(Payment.payment_date.desc()).all()
    
    return payments

@router.get("/summary/overdue")
async def get_overdue_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna um resumo das contas vencidas"""
    query = db.query(AccountReceivable).filter(
        AccountReceivable.status == "overdue"
    )
    
    if current_user.role != "admin":
        query = query.join(Sale).filter(Sale.seller_id == current_user.id)
    
    overdue_accounts = query.all()
    
    total_overdue = sum(account.amount - account.paid_amount for account in overdue_accounts)
    
    return {
        "total_overdue_amount": total_overdue,
        "overdue_count": len(overdue_accounts),
        "accounts": [
            {
                "id": account.id,
                "customer_name": account.customer.name,
                "amount": account.amount,
                "paid_amount": account.paid_amount,
                "remaining": account.amount - account.paid_amount,
                "due_date": account.due_date
            }
            for account in overdue_accounts
        ]
    } 