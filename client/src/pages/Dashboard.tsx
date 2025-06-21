import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface DashboardStats {
  total_sales: number;
  total_count: number;
  payment_methods: Array<{
    method: string;
    total: number;
    count: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>(
    'daily-summary',
    async () => {
      const response = await api.get('/sales/daily-summary');
      return response.data;
    }
  );

  const { data: products } = useQuery(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    }
  );

  const lowStockProducts = products?.filter((product: any) => 
    product.stock_quantity <= product.min_stock
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Vendas Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {isLoading ? '...' : stats?.total_count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Faturamento Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {isLoading ? '...' : `R$ ${(stats?.total_sales || 0).toFixed(2)}`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Produtos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Estoque Baixo
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lowStockProducts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {stats?.payment_methods && stats.payment_methods.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Vendas por Forma de Pagamento
            </h3>
            <div className="space-y-3">
              {stats.payment_methods.map((method) => (
                <div key={method.method} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 capitalize">
                    {method.method}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {method.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {method.count} vendas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Produtos com Estoque Baixo
            </h3>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                  <span className="text-sm font-medium text-gray-900">
                    {product.name}
                  </span>
                  <span className="text-sm text-red-600">
                    {product.stock_quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 