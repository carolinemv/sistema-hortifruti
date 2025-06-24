import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Truck, Search, Filter } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
}

const Suppliers: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [nameFilter, setNameFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>(
    ['suppliers', nameFilter],
    async () => {
      const params: any = {};
      if (nameFilter) params.name = nameFilter;
      const response = await api.get('/suppliers', { params });
      return response.data;
    }
  );

  const createSupplier = useMutation(
    async (supplierData: any) => {
      const response = await api.post('/suppliers', supplierData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('suppliers');
        setShowModal(false);
      },
    }
  );

  const updateSupplier = useMutation(
    async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('suppliers');
        setShowModal(false);
        setEditingSupplier(null);
      },
    }
  );

  const deleteSupplier = useMutation(
    async (id: number) => {
      await api.delete(`/suppliers/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('suppliers');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supplierData = {
      name: formData.get('name') as string,
      cnpj: formData.get('cnpj') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier.id, data: supplierData });
    } else {
      createSupplier.mutate(supplierData);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const clearFilter = () => {
    setNameFilter('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando fornecedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">Gerencie seus fornecedores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Fornecedor
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Digite o nome do fornecedor..."
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={clearFilter}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {suppliers?.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start flex-1 min-w-0">
                <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{supplier.name}</h3>
                  <p className="text-sm text-gray-500">{supplier.cnpj}</p>
                </div>
              </div>
              <div className="flex space-x-2 ml-2">
                <button
                  onClick={() => openEditModal(supplier)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteSupplier.mutate(supplier.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                <span className="text-gray-500">Telefone:</span>
                <span className="font-medium break-all">{supplier.phone}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium break-all">{supplier.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Endereço:</span>
                <p className="font-medium mt-1 break-words">{supplier.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suppliers?.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-gray-500">
            {nameFilter ? 'Tente ajustar os filtros de busca.' : 'Os fornecedores cadastrados aparecerão aqui.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingSupplier?.name}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  defaultValue={editingSupplier?.cnpj}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingSupplier?.phone}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingSupplier?.email}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <textarea
                  name="address"
                  defaultValue={editingSupplier?.address}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 w-full sm:w-auto"
                >
                  {editingSupplier ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers; 