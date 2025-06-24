import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api, getCustomerSummary, createCustomerPayment, CustomerSummary } from '../services/api';
import { DollarSign, Calendar, User, AlertTriangle, CheckCircle, Clock, Filter, Plus, Users } from 'lucide-react';

interface AccountReceivable {
  id: number;
  sale_id: number;
  customer_id: number;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  paid_at?: string;  // Data de quitação completa
  notes: string;
  created_at: string;
  customer: {
    name: string;
    cpf: string;
  };
  sale: {
    id: number;
    total_amount: number;
    payment_method: string;
  };
  payments: Array<{
    id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes: string;
    created_by: number;
    user: {
      full_name: string;
    };
  }>;
}

interface Payment {
  id: number;
  account_receivable_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string;
  user: {
    full_name: string;
  };
}

interface OverdueSummary {
  total_overdue_amount: number;
  overdue_count: number;
  accounts: Array<{
    id: number;
    customer_name: string;
    amount: number;
    paid_amount: number;
    remaining: number;
    due_date: string;
  }>;
}

const AccountsReceivable: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [customerNameFilter, setCustomerNameFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<AccountReceivable[]>(
    ['accounts-receivable', selectedStatus, customerNameFilter, startDateFilter, endDateFilter],
    async () => {
      const params: any = {};
      if (selectedStatus) params.status = selectedStatus;
      if (customerNameFilter) params.customer_name = customerNameFilter;
      if (startDateFilter) params.start_date = startDateFilter;
      if (endDateFilter) params.end_date = endDateFilter;
      const response = await api.get('/accounts-receivable', { params });
      return response.data;
    }
  );

  const { data: overdueSummary } = useQuery<OverdueSummary>(
    'overdue-summary',
    async () => {
      const response = await api.get('/accounts-receivable/summary/overdue');
      return response.data;
    }
  );

  const createPayment = useMutation(
    async (paymentData: any) => {
      const response = await api.post(`/accounts-receivable/${selectedAccount!.id}/payments`, paymentData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts-receivable');
        queryClient.invalidateQueries('overdue-summary');
        setShowPaymentModal(false);
        setSelectedAccount(null);
        setPaymentAmount('');
        setPaymentNotes('');
        alert('Pagamento registrado com sucesso!');
      },
    }
  );

  const createCustomerPaymentMutation = useMutation(
    async (paymentData: any) => {
      const response = await createCustomerPayment(selectedCustomer!.customer.id, paymentData);
      return response;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts-receivable');
        queryClient.invalidateQueries('overdue-summary');
        setShowCustomerPaymentModal(false);
        setSelectedCustomer(null);
        setPaymentAmount('');
        setPaymentNotes('');
        setCustomerSearch('');
        setCustomerSearchResults([]);
        alert('Pagamento avulso registrado com sucesso!');
      },
    }
  );

  const searchCustomers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get('/customers', { params: { name: searchTerm } });
      setCustomerSearchResults(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSelect = async (customer: any) => {
    try {
      const summary = await getCustomerSummary(customer.id);
      setSelectedCustomer(summary);
      setCustomerSearch(customer.name);
      setCustomerSearchResults([]);
    } catch (error) {
      console.error('Error loading customer summary:', error);
      alert('Erro ao carregar dados do cliente');
    }
  };

  const handleCustomerPayment = () => {
    if (!selectedCustomer || !paymentAmount) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      alert('O valor do pagamento deve ser maior que zero');
      return;
    }

    if (amount > selectedCustomer.summary.total_remaining) {
      alert(`O valor do pagamento não pode exceder R$ ${selectedCustomer.summary.total_remaining.toFixed(2)}`);
      return;
    }

    createCustomerPaymentMutation.mutate({
      amount: amount,
      payment_method: paymentMethod,
      notes: paymentNotes
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'partial':
        return 'Parcial';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handlePayment = () => {
    if (!selectedAccount || !paymentAmount) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      alert('O valor do pagamento deve ser maior que zero');
      return;
    }

    const remainingAmount = selectedAccount.amount - selectedAccount.paid_amount;
    if (amount > remainingAmount) {
      alert(`O valor do pagamento não pode exceder R$ ${remainingAmount.toFixed(2)}`);
      return;
    }

    createPayment.mutate({
      amount: amount,
      payment_method: paymentMethod,
      notes: paymentNotes
    });
  };

  const getRemainingAmount = (account: AccountReceivable) => {
    return account.amount - account.paid_amount;
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setCustomerNameFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando contas a receber...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-600">Gerencie as vendas em fiado e recebimentos</p>
        </div>
        <button
          onClick={() => setShowCustomerPaymentModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Pagamento Avulso
        </button>
      </div>

      {/* Overdue Summary */}
      {overdueSummary && overdueSummary.overdue_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Contas Vencidas: {overdueSummary.overdue_count}
              </h3>
              <p className="text-red-700">
                Total em atraso: R$ {overdueSummary.total_overdue_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={customerNameFilter}
              onChange={(e) => setCustomerNameFilter(e.target.value)}
              placeholder="Nome do cliente..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts?.map((account) => (
          <div key={account.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conta #{account.id} - Venda #{account.sale.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cliente: {account.customer.name} - {account.customer.cpf}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">
                  R$ {getRemainingAmount(account).toFixed(2)}
                </div>
                <div className={`text-sm px-2 py-1 rounded-full inline-flex items-center ${getStatusColor(account.status)}`}>
                  {getStatusIcon(account.status)}
                  <span className="ml-1">{getStatusText(account.status)}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span>Vencimento: {formatDate(account.due_date)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Valor total:</span>
                <span className="ml-1 font-medium">R$ {account.amount.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Já pago:</span>
                <span className="ml-1 font-medium">R$ {account.paid_amount.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Restante:</span>
                <span className="ml-1 font-medium">R$ {getRemainingAmount(account).toFixed(2)}</span>
              </div>
            </div>

            {/* Data de quitação */}
            {account.paid_at && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Quitado em: {formatDate(account.paid_at)}</span>
                </div>
              </div>
            )}

            {/* Histórico de pagamentos */}
            {account.payments && account.payments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Histórico de Pagamentos:</h4>
                <div className="space-y-2">
                  {account.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                      <div className="flex items-center">
                        <span className="font-medium">R$ {payment.amount.toFixed(2)}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{payment.payment_method}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{formatDate(payment.payment_date)}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {payment.user?.full_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {account.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">{account.notes}</p>
              </div>
            )}

            {getRemainingAmount(account) > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowPaymentModal(true);
                  }}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Registrar Pagamento
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {accounts?.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma conta a receber encontrada
          </h3>
          <p className="text-gray-500">
            As contas a receber aparecerão aqui quando houver vendas em fiado.
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Registrar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <p className="text-gray-900">{selectedAccount.customer.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Restante
                </label>
                <p className="text-gray-900">R$ {getRemainingAmount(selectedAccount).toFixed(2)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Pagamento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Observações sobre o pagamento..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                disabled={createPayment.isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {createPayment.isLoading ? 'Registrando...' : 'Registrar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Payment Modal */}
      {showCustomerPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Registrar Pagamento Avulso</h3>
            
            <div className="space-y-4">
              {/* Busca de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Cliente
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (e.target.value.length >= 2) {
                        searchCustomers(e.target.value);
                      } else {
                        setCustomerSearchResults([]);
                      }
                    }}
                    placeholder="Digite o nome do cliente..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                {/* Resultados da busca */}
                {customerSearchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-md max-h-32 overflow-y-auto">
                    {customerSearchResults.map((customer) => (
                      <div 
                        key={customer.id} 
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">CPF: {customer.cpf}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações do cliente selecionado */}
              {selectedCustomer && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Cliente: {selectedCustomer.customer.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Devido:</span>
                      <div className="font-medium text-blue-900">
                        {formatCurrency(selectedCustomer.summary.total_remaining)}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-700">Contas Pendentes:</span>
                      <div className="font-medium text-blue-900">
                        {selectedCustomer.summary.accounts_count}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de contas pendentes */}
                  <div className="mt-3">
                    <div className="text-sm font-medium text-blue-700 mb-2">Contas Pendentes:</div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {selectedCustomer.accounts
                        .filter(account => account.remaining > 0)
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                        .map((account) => (
                          <div key={account.id} className="text-xs bg-white p-2 rounded border">
                            <div className="flex justify-between">
                              <span>Venda #{account.sale_id}</span>
                              <span className="font-medium">{formatCurrency(account.remaining)}</span>
                            </div>
                            <div className="text-gray-600">Vencimento: {formatDate(account.due_date)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Campos do pagamento */}
              {selectedCustomer && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor do Pagamento *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.00"
                      max={selectedCustomer.summary.total_remaining}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: {formatCurrency(selectedCustomer.summary.total_remaining)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <option value="transferencia">Transferência</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Observações sobre o pagamento..."
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomerPaymentModal(false);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                  setCustomerSearchResults([]);
                  setPaymentAmount('');
                  setPaymentNotes('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomerPayment}
                disabled={createCustomerPaymentMutation.isLoading || !selectedCustomer}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCustomerPaymentMutation.isLoading ? 'Registrando...' : 'Registrar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivable; 