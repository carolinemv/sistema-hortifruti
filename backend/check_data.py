#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Customer, Product, User, Sale, AccountReceivable, Payment

def check_data():
    db = SessionLocal()
    try:
        # Verificar clientes
        customers = db.query(Customer).all()
        print(f"Clientes encontrados: {len(customers)}")
        for customer in customers:
            print(f"  - {customer.name} (CPF: {customer.cpf})")
        
        # Verificar produtos
        products = db.query(Product).all()
        print(f"\nProdutos encontrados: {len(products)}")
        for product in products:
            print(f"  - {product.name} (R$ {product.price:.2f}, Estoque: {product.stock_quantity})")
        
        # Verificar usuários
        users = db.query(User).all()
        print(f"\nUsuários encontrados: {len(users)}")
        for user in users:
            print(f"  - {user.full_name} (Email: {user.email}, Role: {user.role})")
        
        # Verificar vendas
        sales = db.query(Sale).all()
        print(f"\nVendas encontradas: {len(sales)}")
        for sale in sales:
            customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
            seller = db.query(User).filter(User.id == sale.seller_id).first()
            print(f"  - Venda #{sale.id}: R$ {sale.total_amount:.2f} - Cliente: {customer.name if customer else 'N/A'} - Vendedor: {seller.full_name if seller else 'N/A'} - Status: {sale.status}")
        
        # Verificar contas a receber
        accounts = db.query(AccountReceivable).all()
        print(f"\nContas a receber encontradas: {len(accounts)}")
        for account in accounts:
            customer = db.query(Customer).filter(Customer.id == account.customer_id).first()
            print(f"  - Conta #{account.id}: R$ {account.amount:.2f} - Pago: R$ {account.paid_amount:.2f} - Cliente: {customer.name if customer else 'N/A'} - Status: {account.status}")
        
        # Verificar pagamentos
        payments = db.query(Payment).all()
        print(f"\nPagamentos encontrados: {len(payments)}")
        for payment in payments:
            print(f"  - Pagamento #{payment.id}: R$ {payment.amount:.2f} - Método: {payment.payment_method} - Data: {payment.payment_date}")
            
    except Exception as e:
        print(f"Erro ao verificar dados: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_data() 