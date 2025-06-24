import React, { useState, useEffect, useCallback } from 'react';
import { getSales, getSalesByCustomer, SalesByCustomer } from '../services/api';
import { Sale } from '../services/api';
import { Users, DollarSign, Eye, EyeOff } from 'lucide-react';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesByCustomer, setSalesByCustomer] = useState<SalesByCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'customer'>('list');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [userRole, setUserRole] = useState<string>('');
  
  // Filtros para lista normal
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Filtros para visão por cliente
  const [customerViewFilters, setCustomerViewFilters] = useState({
    customer_name: '',
    seller_id: '',
    start_date: '',
    end_date: '',
    status: ''
  });

  // Carregar dados do usuário logado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setUserRole(data.role);
      })
      .catch(err => console.error('Error loading user:', err));
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (customerNameFilter) params.customer_name = customerNameFilter;
      if (sellerFilter && userRole === 'admin') params.seller_id = sellerFilter;
      if (startDateFilter) params.start_date = startDateFilter;
      if (endDateFilter) params.end_date = endDateFilter;
      
      const data = await getSales(params);
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }, [customerNameFilter, sellerFilter, startDateFilter, endDateFilter, userRole]);

  const loadSalesByCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (customerViewFilters.customer_name) params.customer_name = customerViewFilters.customer_name;
      if (customerViewFilters.seller_id && userRole === 'admin') params.seller_id = parseInt(customerViewFilters.seller_id);
      if (customerViewFilters.start_date) params.start_date = customerViewFilters.start_date;
      if (customerViewFilters.end_date) params.end_date = customerViewFilters.end_date;
      if (customerViewFilters.status) params.status = customerViewFilters.status;
      
      console.log('Chamando API com parâmetros:', params);
      const data = await getSalesByCustomer(params);
      console.log('Dados recebidos:', data);
      setSalesByCustomer(data);
    } catch (error) {
      console.error('Error loading sales by customer:', error);
    } finally {
      setLoading(false);
    }
  }, [customerViewFilters, userRole]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    if (viewMode === 'customer') {
      loadSalesByCustomer();
    }
  }, [viewMode, loadSalesByCustomer]);

  const toggleCustomerExpansion = (customerId: number) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vendas</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <DollarSign className="inline w-4 h-4 mr-2" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('customer')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Por Cliente
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        // Visão de lista tradicional
        <div>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  placeholder="Buscar por cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {userRole === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sellerFilter}
                    onChange={(e) => setSellerFilter(e.target.value)}
                    placeholder="ID do vendedor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de vendas */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Quitação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.seller?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(sale.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.paid_at ? formatDate(sale.paid_at) : 'Não pago'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Visão consolidada por cliente
        <div>
          {/* Filtros para visão por cliente */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerViewFilters.customer_name}
                  onChange={(e) => setCustomerViewFilters(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Buscar por cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {userRole === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor ID
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customerViewFilters.seller_id}
                    onChange={(e) => setCustomerViewFilters(prev => ({ ...prev, seller_id: e.target.value }))}
                    placeholder="ID do vendedor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={customerViewFilters.status}
                  onChange={(e) => setCustomerViewFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="completed">Concluída</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={customerViewFilters.start_date}
                  onChange={(e) => setCustomerViewFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={customerViewFilters.end_date}
                  onChange={(e) => setCustomerViewFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de clientes com vendas */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : salesByCustomer.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado</div>
            ) : (
              salesByCustomer.map((customerData) => (
                <div key={customerData.customer.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Cabeçalho do cliente */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customerData.customer.name}
                        </h3>
                        <p className="text-sm text-gray-600">CPF: {customerData.customer.cpf}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(customerData.summary.total_amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customerData.summary.sales_count} vendas
                        </div>
                      </div>
                    </div>
                    
                    {/* Estatísticas por status */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(customerData.summary.status_stats).map(([status, stats]) => (
                        <div key={status} className="flex items-center space-x-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({stats.count} vendas - {formatCurrency(stats.amount)})
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => toggleCustomerExpansion(customerData.customer.id)}
                      className="mt-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {expandedCustomers.has(customerData.customer.id) ? (
                        <EyeOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {expandedCustomers.has(customerData.customer.id) ? 'Ocultar' : 'Ver'} vendas
                    </button>
                  </div>
                  
                  {/* Lista de vendas do cliente */}
                  {expandedCustomers.has(customerData.customer.id) && (
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Vendas do Cliente</h4>
                      <div className="space-y-3">
                        {customerData.sales.map((sale) => (
                          <div key={sale.id} className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">
                                  Venda #{sale.id} - {formatCurrency(sale.total_amount)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {sale.payment_method} • {formatDate(sale.created_at)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Vendedor: {sale.seller?.name || 'N/A'}
                                </div>
                                <div className="mt-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                                    {sale.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Itens da venda */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm font-medium text-gray-700 mb-2">Itens:</div>
                              <div className="space-y-1">
                                {sale.items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm text-gray-600">
                                    <span>{item.product_name} x{item.quantity}</span>
                                    <span>{formatCurrency(item.total_price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales; 