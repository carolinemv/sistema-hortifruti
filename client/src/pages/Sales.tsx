import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { ShoppingCart, Calendar, DollarSign } from 'lucide-react';

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
  };
}

interface Sale {
  id: number;
  customer_id: number;
  user_id: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  customer: {
    name: string;
  };
  user: {
    full_name: string;
  };
  items: SaleItem[];
}

const Sales: React.FC = () => {
  const { data: sales, isLoading } = useQuery<Sale[]>(
    'sales',
    async () => {
      const response = await api.get('/sales');
      return response.data;
    }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
        <p className="text-gray-600">Visualize todas as vendas realizadas</p>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {sales?.map((sale) => (
          <div key={sale.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Venda #{sale.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cliente: {sale.customer.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">
                  R$ {sale.total_amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {sale.payment_method}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span>{formatDate(sale.created_at)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Vendedor:</span>
                <span className="ml-1 font-medium">{sale.user.full_name}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`ml-1 font-medium capitalize ${
                  sale.status === 'completed' ? 'text-green-600' : 
                  sale.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {sale.status === 'completed' ? 'Concluída' :
                   sale.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Sale Items */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Itens da Venda:</h4>
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>{item.product.name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">
                        {item.quantity} x R$ {item.unit_price.toFixed(2)}
                      </span>
                      <span className="font-medium">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sales?.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma venda encontrada
          </h3>
          <p className="text-gray-500">
            As vendas realizadas aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales; 