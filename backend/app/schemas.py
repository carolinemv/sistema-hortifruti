from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User Schemas ---
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

class User(UserBase):
    id: int
    role: str
    is_active: bool
    class Config:
        from_attributes = True

# --- Password Reset Schemas ---
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# --- Supplier Schemas ---
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

# --- Customer Schemas ---
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

# --- Product Schemas ---
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
    supplier: Supplier
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

# --- Sale Schemas ---
class SaleItemBase(BaseModel):
    product_id: int
    quantity: float

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    unit_price: float
    total_price: float
    product: Product
    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    payment_method: str
    customer_id: int

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class Sale(SaleBase):
    id: int
    seller_id: int
    total_amount: float
    created_at: datetime
    items: List[SaleItem] = []
    customer: Optional[Customer] = None
    seller: User
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

class StockMovementCreate(StockMovementBase):
    pass

class StockMovement(StockMovementBase):
    id: int
    user_id: int
    created_at: datetime
    product: "Product"
    user: "User"

    class Config:
        from_attributes = True 