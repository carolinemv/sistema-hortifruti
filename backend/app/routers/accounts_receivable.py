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
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
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
    
    if start_date:
        query = query.filter(AccountReceivable.due_date >= start_date)
    
    if end_date:
        query = query.filter(AccountReceivable.due_date <= end_date + " 23:59:59")
    
    if current_user.role != "admin":
        # Vendedores só veem contas de vendas que eles fizeram
        query = query.join(Sale).filter(Sale.seller_id == current_user.id)
    
    accounts = query.order_by(AccountReceivable.due_date.asc()).offset(skip).limit(limit).all()
    
    # Buscar pagamentos para cada conta
    result = []
    for account in accounts:
        payments = db.query(Payment).options(
            joinedload(Payment.user)
        ).filter(Payment.account_receivable_id == account.id).order_by(Payment.payment_date.asc()).all()
        
        account_dict = {
            "id": account.id,
            "sale_id": account.sale_id,
            "customer_id": account.customer_id,
            "amount": account.amount,
            "paid_amount": account.paid_amount,
            "due_date": account.due_date,
            "status": account.status,
            "paid_at": account.paid_at,
            "notes": account.notes,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
            "sale": account.sale,
            "customer": account.customer,
            "payments": [
                {
                    "id": payment.id,
                    "amount": payment.amount,
                    "payment_method": payment.payment_method,
                    "payment_date": payment.payment_date,
                    "notes": payment.notes,
                    "created_by": payment.created_by,
                    "user": payment.user
                }
                for payment in payments
            ]
        }
        result.append(account_dict)
    
    return result

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
        db_account.paid_at = datetime.now()  # Definir data de quitação
        
        # Atualizar também a data de quitação da venda
        if db_account.sale_id:
            sale = db.query(Sale).filter(Sale.id == db_account.sale_id).first()
            if sale:
                sale.paid_at = datetime.now()
                sale.status = "completed"
    elif db_account.paid_amount > 0:
        db_account.status = "partial"
    elif db_account.due_date < datetime.now():
        db_account.status = "overdue"
    
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
        account.paid_at = datetime.now()  # Definir data de quitação
        
        # Atualizar também a data de quitação da venda
        if account.sale_id:
            sale = db.query(Sale).filter(Sale.id == account.sale_id).first()
            if sale:
                sale.paid_at = datetime.now()
                sale.status = "completed"
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

@router.post("/customer/{customer_id}/payments", response_model=PaymentSchema, status_code=201)
async def create_customer_payment(
    customer_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar pagamento avulso para um cliente (sistema FIFO)"""
    # Verificar se o cliente existe
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Buscar todas as contas a receber pendentes do cliente (FIFO - mais antigas primeiro)
    pending_accounts = db.query(AccountReceivable).filter(
        AccountReceivable.customer_id == customer_id,
        AccountReceivable.status.in_(["pending", "partial", "overdue"])
    ).order_by(AccountReceivable.due_date.asc()).all()
    
    if not pending_accounts:
        raise HTTPException(status_code=400, detail="Customer has no pending accounts receivable")
    
    # Calcular total devido
    total_due = sum(account.amount - account.paid_amount for account in pending_accounts)
    if payment.amount > total_due:
        raise HTTPException(status_code=400, detail=f"Payment amount exceeds total due (R$ {total_due:.2f})")
    
    # Aplicar pagamento usando FIFO
    remaining_payment = payment.amount
    payments_created = []
    
    for account in pending_accounts:
        if remaining_payment <= 0:
            break
            
        account_remaining = account.amount - account.paid_amount
        payment_amount = min(remaining_payment, account_remaining)
        
        # Criar pagamento para esta conta
        db_payment = Payment(
            amount=payment_amount,
            payment_method=payment.payment_method,
            payment_date=datetime.now(),
            notes=payment.notes or f"Pagamento avulso - {payment_amount:.2f} aplicado",
            account_receivable_id=account.id,
            created_by=current_user.id
        )
        db.add(db_payment)
        payments_created.append(db_payment)
        
        # Atualizar conta a receber
        account.paid_amount += payment_amount
        
        # Atualizar status da conta
        if account.paid_amount >= account.amount:
            account.status = "paid"
            account.paid_at = datetime.now()  # Definir data de quitação
            
            # Atualizar também a data de quitação da venda
            if account.sale_id:
                sale = db.query(Sale).filter(Sale.id == account.sale_id).first()
                if sale:
                    sale.paid_at = datetime.now()
                    sale.status = "completed"
        else:
            account.status = "partial"
        
        remaining_payment -= payment_amount
    
    db.commit()
    
    # Retornar o primeiro pagamento criado (representativo)
    return payments_created[0] if payments_created else None

@router.get("/customer/{customer_id}/summary")
async def get_customer_summary(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna resumo das contas a receber de um cliente específico"""
    # Verificar se o cliente existe
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Buscar todas as contas a receber do cliente
    accounts = db.query(AccountReceivable).options(
        joinedload(AccountReceivable.sale)
    ).filter(AccountReceivable.customer_id == customer_id).order_by(AccountReceivable.due_date.asc()).all()
    
    # Calcular totais
    total_amount = sum(account.amount for account in accounts)
    total_paid = sum(account.paid_amount for account in accounts)
    total_remaining = total_amount - total_paid
    
    # Contar por status
    status_counts = {}
    for account in accounts:
        status = account.status
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "cpf": customer.cpf
        },
        "summary": {
            "total_amount": total_amount,
            "total_paid": total_paid,
            "total_remaining": total_remaining,
            "accounts_count": len(accounts),
            "status_counts": status_counts
        },
        "accounts": [
            {
                "id": account.id,
                "sale_id": account.sale_id,
                "amount": account.amount,
                "paid_amount": account.paid_amount,
                "remaining": account.amount - account.paid_amount,
                "status": account.status,
                "due_date": account.due_date,
                "created_at": account.created_at,
                "sale": {
                    "id": account.sale.id,
                    "total_amount": account.sale.total_amount,
                    "payment_method": account.sale.payment_method,
                    "created_at": account.sale.created_at
                } if account.sale else None
            }
            for account in accounts
        ]
    } 