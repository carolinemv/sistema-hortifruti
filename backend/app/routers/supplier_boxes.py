from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import SupplierBox, BoxMovement, Supplier
from ..schemas import SupplierBoxCreate, SupplierBoxUpdate, SupplierBox as SupplierBoxSchema, BoxMovementCreate, BoxMovement as BoxMovementSchema
from ..auth import get_current_active_user, get_current_admin_user
from ..models import User

router = APIRouter(
    prefix="/supplier-boxes",
    tags=["supplier-boxes"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[SupplierBoxSchema])
async def get_supplier_boxes(
    supplier_id: int = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Lista caixas de fornecedores com filtros opcionais"""
    query = db.query(SupplierBox).options(joinedload(SupplierBox.supplier))
    
    if supplier_id:
        query = query.filter(SupplierBox.supplier_id == supplier_id)
    
    if status:
        query = query.filter(SupplierBox.status == status)
    
    boxes = query.filter(SupplierBox.is_active == True).order_by(SupplierBox.created_at.desc()).all()
    return boxes

@router.get("/{box_id}", response_model=SupplierBoxSchema)
async def get_supplier_box(
    box_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtém uma caixa específica"""
    box = db.query(SupplierBox).options(joinedload(SupplierBox.supplier)).filter(SupplierBox.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Supplier box not found")
    return box

@router.post("/", response_model=SupplierBoxSchema, status_code=201)
async def create_supplier_box(
    box: SupplierBoxCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Cria uma nova caixa de fornecedor (apenas para admins)"""
    # Verificar se o fornecedor existe
    supplier = db.query(Supplier).filter(Supplier.id == box.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Verificar se o número da caixa já existe para este fornecedor
    existing_box = db.query(SupplierBox).filter(
        SupplierBox.supplier_id == box.supplier_id,
        SupplierBox.box_number == box.box_number
    ).first()
    
    if existing_box:
        raise HTTPException(status_code=400, detail="Box number already exists for this supplier")
    
    db_box = SupplierBox(**box.dict())
    db.add(db_box)
    db.commit()
    db.refresh(db_box)
    return db_box

@router.put("/{box_id}", response_model=SupplierBoxSchema)
async def update_supplier_box(
    box_id: int,
    box_update: SupplierBoxUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Atualiza uma caixa de fornecedor (apenas para admins)"""
    db_box = db.query(SupplierBox).filter(SupplierBox.id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Supplier box not found")
    
    update_data = box_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_box, key, value)
    
    db.commit()
    db.refresh(db_box)
    return db_box

@router.delete("/{box_id}", status_code=204)
async def delete_supplier_box(
    box_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Desativa uma caixa de fornecedor (apenas para admins)"""
    db_box = db.query(SupplierBox).filter(SupplierBox.id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Supplier box not found")
    
    db_box.is_active = False
    db.commit()
    return

# Box Movement endpoints
@router.get("/{box_id}/movements", response_model=List[BoxMovementSchema])
async def get_box_movements(
    box_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Lista movimentações de uma caixa específica"""
    movements = db.query(BoxMovement).options(
        joinedload(BoxMovement.user)
    ).filter(BoxMovement.supplier_box_id == box_id).order_by(BoxMovement.created_at.desc()).all()
    return movements

@router.post("/{box_id}/movements", response_model=BoxMovementSchema, status_code=201)
async def create_box_movement(
    box_id: int,
    movement: BoxMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Registra uma movimentação de caixa"""
    # Verificar se a caixa existe
    box = db.query(SupplierBox).filter(SupplierBox.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Supplier box not found")
    
    # Criar a movimentação
    db_movement = BoxMovement(**movement.dict(), user_id=current_user.id)
    db.add(db_movement)
    
    # Atualizar o peso atual da caixa
    if movement.movement_type == "entrada":
        box.current_weight += movement.weight
    elif movement.movement_type == "saída":
        if box.current_weight < movement.weight:
            raise HTTPException(status_code=400, detail="Insufficient weight in box")
        box.current_weight -= movement.weight
    
    # Atualizar status da caixa se necessário
    if box.current_weight == 0:
        box.status = "disponível"
    elif box.current_weight > 0:
        box.status = "em_uso"
    
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.get("/summary/status")
async def get_boxes_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna um resumo das caixas por status"""
    summary = db.query(
        SupplierBox.status,
        db.func.count(SupplierBox.id).label('count')
    ).filter(SupplierBox.is_active == True).group_by(SupplierBox.status).all()
    
    return {
        "summary": [
            {
                "status": item.status,
                "count": item.count
            }
            for item in summary
        ]
    } 