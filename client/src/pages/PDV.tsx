import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  cpf: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

const PDV: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const queryClient = useQueryClient();

  const { data: products } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    }
  );

  const { data: customers } = useQuery<Customer[]>(
    'customers',
    async () => {
      const response = await api.get('/customers');
      return response.data;
    }
  );

  const createSale = useMutation(
    async (saleData: any) => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sales');
        setCart([]);
        setSelectedCustomer(null);
        alert('Venda realizada com sucesso!');
      },
    }
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.price }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products?.find(p => p.id === productId);
    if (product && newQuantity <= product.stock_quantity) {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
          : item
      ));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCustomerChange = (customerId: string) => {
    if (cart.length > 0) {
      if (window.confirm('Trocar o cliente irá limpar o carrinho atual. Deseja continuar?')) {
        setCart([]);
      } else {
        return; // Mantém o cliente atual se o usuário cancelar
      }
    }
    const customer = customers?.find(c => c.id === parseInt(customerId));
    setSelectedCustomer(customer || null);
  };

  const handleCheckout = () => {
    if (!selectedCustomer) {
      alert('Selecione um cliente');
      return;
    }

    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    const saleData = {
      customer_id: selectedCustomer.id,
      payment_method: paymentMethod,
      total_amount: getTotal(),
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.total
      }))
    };

    createSale.mutate(saleData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
          <p className="text-gray-600">Selecione os produtos para a venda</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products?.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <span className="text-lg font-bold text-primary-600">
                  R$ {product.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Estoque: {product.stock_quantity} {product.unit}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Clique para adicionar
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Carrinho</h2>
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Selecione um cliente</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.cpf}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">
                    R$ {item.product.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    disabled={item.quantity >= item.product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <span className="font-bold">R$ {item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
            </select>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary-600">R$ {getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={!selectedCustomer || cart.length === 0 || createSale.isLoading}
            className="w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {createSale.isLoading ? 'Finalizando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDV; 