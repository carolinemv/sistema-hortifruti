from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, EmailStr
from datetime import datetime

if TYPE_CHECKING:
    from .models import Location, Product, User, Sale, Customer, Supplier, SupplierBox, AccountReceivable

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "vendedor"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    cnpj: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    cpf: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

# Product schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: float
    unit: str
    supplier_id: int
    category: Optional[str] = None

class ProductCreate(ProductBase):
    cost_price: float

class Product(ProductBase):
    id: int
    cost_price: float
    is_active: bool
    supplier: "Supplier"
    
    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None
    cost_price: Optional[float] = None

# Sale schemas
class SaleItemBase(BaseModel):
    product_id: int
    quantity: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    unit_price: float
    total_price: float
    product: "Product"
    
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    payment_method: str
    customer_id: int

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    due_date: Optional[str] = None  # Data de vencimento para vendas fiado

class Sale(SaleBase):
    id: int
    seller_id: int
    total_amount: float
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None  # Data de quitação
    items: List[SaleItem] = []
    customer: Optional["Customer"] = None
    seller: "User"
    class Config:
        from_attributes = True

class SaleUpdate(BaseModel):
    customer_id: Optional[int] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None

# Stock Movement schemas
class StockMovementBase(BaseModel):
    product_id: int
    movement_type: str
    quantity: float
    reason: str
    from_location_id: Optional[int] = None
    to_location_id: Optional[int] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovement(StockMovementBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Location Schemas ---
class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    location_type: Optional[str] = None
    temperature: Optional[float] = None
    capacity: Optional[float] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location_type: Optional[str] = None
    temperature: Optional[float] = None
    capacity: Optional[float] = None
    is_active: Optional[bool] = None

# --- Product Location Schemas ---
class ProductLocationBase(BaseModel):
    product_id: int
    location_id: int
    quantity: float = 0
    min_quantity: float = 0
    max_quantity: float = 0
    notes: Optional[str] = None

class ProductLocationCreate(ProductLocationBase):
    pass

class ProductLocation(ProductLocationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional["Product"] = None
    location: Optional["Location"] = None
    
    class Config:
        from_attributes = True

class ProductLocationUpdate(BaseModel):
    quantity: Optional[float] = None
    min_quantity: Optional[float] = None
    max_quantity: Optional[float] = None
    notes: Optional[str] = None

# --- Supplier Box Schemas ---
class SupplierBoxBase(BaseModel):
    supplier_id: int
    box_number: str
    box_type: Optional[str] = None
    capacity: Optional[float] = None
    current_weight: float = 0
    status: str = "disponível"
    notes: Optional[str] = None

class SupplierBoxCreate(SupplierBoxBase):
    pass

class SupplierBox(SupplierBoxBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional["Supplier"] = None
    
    class Config:
        from_attributes = True

class SupplierBoxUpdate(BaseModel):
    box_type: Optional[str] = None
    capacity: Optional[float] = None
    current_weight: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

# --- Box Movement Schemas ---
class BoxMovementBase(BaseModel):
    supplier_box_id: int
    movement_type: str
    quantity: float
    weight: float
    reason: str

class BoxMovementCreate(BoxMovementBase):
    pass

class BoxMovement(BoxMovementBase):
    id: int
    user_id: int
    created_at: datetime
    supplier_box: Optional["SupplierBox"] = None
    user: Optional["User"] = None
    
    class Config:
        from_attributes = True

# --- Account Receivable Schemas ---
class AccountReceivableBase(BaseModel):
    sale_id: int
    customer_id: int
    amount: float
    due_date: datetime
    notes: Optional[str] = None

class AccountReceivableCreate(AccountReceivableBase):
    pass

class AccountReceivable(AccountReceivableBase):
    id: int
    paid_amount: float
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    sale: Optional["Sale"] = None
    customer: Optional["Customer"] = None
    
    class Config:
        from_attributes = True

class AccountReceivableUpdate(BaseModel):
    paid_amount: Optional[float] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None

# --- Payment Schemas ---
class PaymentBase(BaseModel):
    amount: float
    payment_method: str
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    account_receivable_id: int
    payment_date: datetime
    created_by: int
    account_receivable: Optional["AccountReceivable"] = None
    user: Optional["User"] = None
    
    class Config:
        from_attributes = True 