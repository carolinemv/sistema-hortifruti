from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    vendedor = "vendedor"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="vendedor")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sales = relationship("Sale", back_populates="seller")
    stock_movements = relationship("StockMovement", back_populates="user")

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cnpj = Column(String, unique=True, index=True)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    products = relationship("Product", back_populates="supplier")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cpf = Column(String, unique=True, index=True)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sales = relationship("Sale", back_populates="customer")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    cost_price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    unit = Column(String)  # kg, unidade, etc.
    category = Column(String)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    supplier = relationship("Supplier", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
    product_locations = relationship("ProductLocation", back_populates="product")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    payment_method = Column(String)  # dinheiro, cartão, pix, etc.
    status = Column(String, default="completed")  # completed, cancelled, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)  # Data de quitação
    
    customer = relationship("Customer", back_populates="sales")
    seller = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float)
    unit_price = Column(Float)
    total_price = Column(Float)
    
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    movement_type = Column(String)  # entrada, saída, ajuste, transferência
    quantity = Column(Float)
    reason = Column(Text)
    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    product = relationship("Product", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")
    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])

class AccountReceivable(Base):
    __tablename__ = "accounts_receivable"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Valor total da conta
    paid_amount = Column(Float, default=0)  # Valor já pago
    due_date = Column(DateTime(timezone=True), nullable=False)  # Data de vencimento
    status = Column(String, default="pending")  # pending, partial, paid, overdue
    paid_at = Column(DateTime(timezone=True), nullable=True)  # Data de quitação completa
    notes = Column(Text)  # Observações sobre o fiado
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sale = relationship("Sale")
    customer = relationship("Customer")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    account_receivable_id = Column(Integer, ForeignKey("accounts_receivable.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Valor do pagamento
    payment_method = Column(String)  # dinheiro, cartão, pix, etc.
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)  # Observações sobre o pagamento
    created_by = Column(Integer, ForeignKey("users.id"))
    
    account_receivable = relationship("AccountReceivable")
    user = relationship("User")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Ex: "Câmara Fria 1", "Câmara Fria 2", "Depósito", "Área Externa"
    description = Column(Text)
    location_type = Column(String)  # "camara_fria", "deposito", "area_externa", "prateleira", "congelador"
    temperature = Column(Float, nullable=True)  # Temperatura em graus Celsius
    capacity = Column(Float, nullable=True)  # Capacidade em kg ou unidades
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    product_locations = relationship("ProductLocation", back_populates="location")

class ProductLocation(Base):
    __tablename__ = "product_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    quantity = Column(Float, default=0)  # Quantidade específica nesta localização
    min_quantity = Column(Float, default=0)  # Quantidade mínima para alerta
    max_quantity = Column(Float, default=0)  # Capacidade máxima
    notes = Column(Text)  # Observações sobre o produto nesta localização
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    product = relationship("Product", back_populates="product_locations")
    location = relationship("Location", back_populates="product_locations")

class SupplierBox(Base):
    __tablename__ = "supplier_boxes"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    box_number = Column(String, nullable=False)  # Número da caixa
    box_type = Column(String)  # "plástico", "papelão", "retornável", etc.
    capacity = Column(Float)  # Capacidade em kg ou unidades
    current_weight = Column(Float, default=0)  # Peso atual
    status = Column(String, default="disponível")  # "disponível", "em_uso", "danificada", "perdida"
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    supplier = relationship("Supplier")
    box_movements = relationship("BoxMovement", back_populates="supplier_box")

class BoxMovement(Base):
    __tablename__ = "box_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_box_id = Column(Integer, ForeignKey("supplier_boxes.id"), nullable=False)
    movement_type = Column(String)  # "entrada", "saída", "devolução", "transferência"
    quantity = Column(Float)  # Quantidade de produtos
    weight = Column(Float)  # Peso movimentado
    reason = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    supplier_box = relationship("SupplierBox", back_populates="box_movements")
    user = relationship("User") 