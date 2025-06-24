#!/usr/bin/env python3

import requests
import json

# URL base
BASE_URL = "http://localhost:8000"

def test_sales_grouped_by_customer():
    """Testa o endpoint de vendas agrupadas por cliente"""
    
    # Primeiro, fazer login para obter token
    login_data = {
        "username": "admin",
        "password": "Admin@2024!"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        if login_response.status_code != 200:
            print(f"Erro no login: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Testar endpoint de vendas agrupadas por cliente
        print("Testando endpoint /sales/grouped-by-customer...")
        response = requests.get(f"{BASE_URL}/sales/grouped-by-customer", headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Dados recebidos: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"Erro: {response.text}")
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    test_sales_grouped_by_customer() 