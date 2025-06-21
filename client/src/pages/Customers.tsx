import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { Plus, Edit, Trash2, User } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
}

const Customers: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery<Customer[]>(
    'customers',
    async () => {
      const response = await api.get('/customers');
      return response.data;
    }
  );

  const createCustomer = useMutation(
    async (customerData: any) => {
      const response = await api.post('/customers', customerData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setShowModal(false);
      },
    }
  );

  const updateCustomer = useMutation(
    async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setShowModal(false);
        setEditingCustomer(null);
      },
    }
  );

  const deleteCustomer = useMutation(
    async (id: number) => {
      await api.delete(`/customers/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get('name') as string,
      cpf: formData.get('cpf') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    if (editingCustomer) {
      updateCustomer.mutate({ id: editingCustomer.id, data: customerData });
    } else {
      createCustomer.mutate(customerData);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers?.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.cpf}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(customer)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteCustomer.mutate(customer.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Telefone:</span>
                <span className="font-medium">{customer.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{customer.email}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Endereço:</span>
                <p className="font-medium mt-1">{customer.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCustomer?.name}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  defaultValue={editingCustomer?.cpf}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingCustomer?.phone}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingCustomer?.email}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <textarea
                  name="address"
                  defaultValue={editingCustomer?.address}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingCustomer ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 