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
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar se já existem usuários
        existing_user = db.query(User).first()
        if existing_user:
            print("Banco de dados já inicializado!")
            return
        
        # Criar usuário administrador
        admin_user = User(
            username="admin",
            email="admin@hortifruti.com",
            full_name="Administrador",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            is_active=True
        )
        db.add(admin_user)
        
        # Criar fornecedores de exemplo
        suppliers = [
            Supplier(
                name="Hortifruti ABC",
                cnpj="12.345.678/0001-90",
                phone="(11) 99999-9999",
                email="contato@hortifrutiabc.com",
                address="Rua das Flores, 123 - São Paulo/SP"
            ),
            Supplier(
                name="Distribuidora Verde",
                cnpj="98.765.432/0001-10",
                phone="(11) 88888-8888",
                email="vendas@distribuidoraverde.com",
                address="Av. das Hortênsias, 456 - São Paulo/SP"
            ),
            Supplier(
                name="Produtos Naturais LTDA",
                cnpj="55.444.333/0001-22",
                phone="(11) 77777-7777",
                email="contato@produtosnaturais.com",
                address="Rua dos Produtores, 789 - São Paulo/SP"
            )
        ]
        
        for supplier in suppliers:
            db.add(supplier)
        
        db.commit()  # Commit para obter os IDs dos fornecedores
        
        # Criar clientes de exemplo
        customers = [
            Customer(
                name="João Silva",
                cpf="123.456.789-00",
                phone="(11) 11111-1111",
                email="joao@email.com",
                address="Rua A, 100 - São Paulo/SP"
            ),
            Customer(
                name="Maria Santos",
                cpf="987.654.321-00",
                phone="(11) 22222-2222",
                email="maria@email.com",
                address="Rua B, 200 - São Paulo/SP"
            ),
            Customer(
                name="Pedro Oliveira",
                cpf="456.789.123-00",
                phone="(11) 33333-3333",
                email="pedro@email.com",
                address="Rua C, 300 - São Paulo/SP"
            )
        ]
        
        for customer in customers:
            db.add(customer)
        
        db.commit()
        
        # Criar produtos de exemplo
        products = [
            Product(
                name="Maçã Fuji",
                description="Maçã Fuji fresca e saborosa",
                price=8.90,
                cost_price=5.50,
                stock_quantity=50,
                min_stock=10,
                unit="kg",
                category="Frutas",
                supplier_id=suppliers[0].id
            ),
            Product(
                name="Banana Prata",
                description="Banana prata de qualidade",
                price=6.50,
                cost_price=4.00,
                stock_quantity=30,
                min_stock=5,
                unit="kg",
                category="Frutas",
                supplier_id=suppliers[0].id
            ),
            Product(
                name="Alface Crespa",
                description="Alface crespa fresca",
                price=3.90,
                cost_price=2.50,
                stock_quantity=20,
                min_stock=8,
                unit="unidade",
                category="Verduras",
                supplier_id=suppliers[1].id
            ),
            Product(
                name="Tomate",
                description="Tomate vermelho maduro",
                price=7.50,
                cost_price=4.80,
                stock_quantity=25,
                min_stock=12,
                unit="kg",
                category="Legumes",
                supplier_id=suppliers[1].id
            ),
            Product(
                name="Cenoura",
                description="Cenoura orgânica",
                price=5.90,
                cost_price=3.20,
                stock_quantity=40,
                min_stock=15,
                unit="kg",
                category="Legumes",
                supplier_id=suppliers[2].id
            ),
            Product(
                name="Laranja Lima",
                description="Laranja lima doce",
                price=4.50,
                cost_price=2.80,
                stock_quantity=35,
                min_stock=10,
                unit="kg",
                category="Frutas",
                supplier_id=suppliers[2].id
            )
        ]
        
        for product in products:
            db.add(product)
        
        db.commit()
        
        print("✅ Banco de dados inicializado com sucesso!")
        print("\n📋 Dados criados:")
        print(f"   👤 Usuário admin: admin / admin123")
        print(f"   🏢 {len(suppliers)} fornecedores")
        print(f"   👥 {len(customers)} clientes")
        print(f"   📦 {len(products)} produtos")
        print("\n🚀 Você pode fazer login no sistema agora!")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 