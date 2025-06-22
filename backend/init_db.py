#!/usr/bin/env python3
"""
Script para inicializar o banco de dados com dados de exemplo
"""

import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User, Supplier, Customer, Product
from app.auth import get_password_hash

def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if admin user already exists
    if db.query(User).filter(User.username == "admin").first():
        print("Banco de dados já inicializado!")
        db.close()
        return

    # --- Criação de Usuários ---
    admin_user = User(
        username="admin",
        email="admin@hortifruti.com",
        full_name="Admin Geral",
        hashed_password=get_password_hash("Admin@2024!"),
        role="admin",
        is_active=True
    )
    vendedor_user = User(
        username="vendedor1",
        email="vendedor1@hortifruti.com",
        full_name="Vendedor Um",
        hashed_password=get_password_hash("Vendedor@123"),
        role="vendedor",
        is_active=True
    )
    db.add(admin_user)
    db.add(vendedor_user)

    # --- Criação de Fornecedores ---
    supplier1 = Supplier(name="Fazenda Sol Nascente", cnpj="11.222.333/0001-44", phone="11987654321", email="contato@solnascente.com")
    supplier2 = Supplier(name="Distribuidora Verde Vale", cnpj="44.555.666/0001-77", phone="11912345678", email="contato@verdeville.com")
    db.add(supplier1)
    db.add(supplier2)
    
    db.commit() # Commit para que os fornecedores tenham IDs

    # --- Criação de Produtos ---
    products = [
        Product(name="Maçã Gala", description="Maçã fresca e crocante", price=5.50, unit="kg", stock_quantity=100.0, supplier_id=supplier1.id, cost_price=3.5),
        Product(name="Banana Prata", description="Banana madura e doce", price=4.00, unit="kg", stock_quantity=150.0, supplier_id=supplier1.id, cost_price=2.5),
        Product(name="Alface Crespa", description="Alface fresca para saladas", price=2.50, unit="unidade", stock_quantity=200.0, supplier_id=supplier2.id, cost_price=1.5),
        Product(name="Tomate Italiano", description="Tomate para molhos", price=7.00, unit="kg", stock_quantity=80.0, supplier_id=supplier2.id, cost_price=4.5),
    ]
    db.add_all(products)

    # --- Criação de Clientes ---
    customers = [
        Customer(name="João Silva", cpf="111.222.333-44", phone="11999998888", email="joao.silva@example.com"),
        Customer(name="Maria Oliveira", cpf="444.555.666-77", phone="11988887777", email="maria.o@example.com")
    ]
    db.add_all(customers)

    db.commit()
    db.close()
    
    print("Banco de dados inicializado com sucesso!")

if __name__ == "__main__":
    init_db() 