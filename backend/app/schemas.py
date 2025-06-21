from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    cnpj: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class Supplier(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    cpf: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class Customer(CustomerBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost_price: float
    stock_quantity: int = 0
    min_stock: int = 0
    unit: str
    category: str
    supplier_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None

class Product(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Supplier

    class Config:
        from_attributes = True

# Sale schemas
class SaleItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_price: float
    total_price: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    sale_id: int
    product: Product

    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    customer_id: int
    payment_method: str
    status: str = "completed"

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    total_amount: float

class SaleUpdate(BaseModel):
    customer_id: Optional[int] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None

class Sale(SaleBase):
    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    customer: Customer
    user: User
    items: List[SaleItem]

    class Config:
        from_attributes = True

# Stock Movement schemas
class StockMovementBase(BaseModel):
    product_id: int
    movement_type: str
    quantity: float
    reason: str

class StockMovementCreate(StockMovementBase):
    pass

class StockMovement(StockMovementBase):
    id: int
    user_id: int
    created_at: datetime
    product: Product
    user: User

    class Config:
        from_attributes = True 