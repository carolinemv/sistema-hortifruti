from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import auth, products, sales, customers, suppliers, accounts_receivable, users, locations, supplier_boxes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hortifruti PDV API",
    description="API para sistema de PDV de hortifruti",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(customers.router)
app.include_router(suppliers.router)
app.include_router(accounts_receivable.router)
app.include_router(users.router)
app.include_router(locations.router)
app.include_router(supplier_boxes.router)

@app.get("/")
async def root():
    return {"message": "Hortifruti PDV API - Sistema de Ponto de Venda"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 