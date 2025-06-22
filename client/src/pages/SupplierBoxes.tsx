import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { Package, Plus, Scale, Truck } from 'lucide-react';

interface SupplierBox {
  id: number;
  supplier_id: number;
  box_number: string;
  box_type: string;
  capacity: number;
  current_weight: number;
  status: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  supplier: {
    name: string;
  };
}

const SupplierBoxes: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    box_number: '',
    box_type: '',
    capacity: '',
    notes: ''
  });
  
  const queryClient = useQueryClient();

  const { data: boxes, isLoading } = useQuery<SupplierBox[]>(
    'supplier-boxes',
    async () => {
      const response = await api.get('/supplier-boxes');
      return response.data;
    }
  );

  const { data: suppliers } = useQuery(
    'suppliers',
    async () => {
      const response = await api.get('/suppliers');
      return response.data;
    }
  );

  const createBox = useMutation(
    async (boxData: any) => {
      const response = await api.post('/supplier-boxes', boxData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('supplier-boxes');
        setShowCreateModal(false);
        setFormData({ supplier_id: '', box_number: '', box_type: '', capacity: '', notes: '' });
        alert('Caixa criada com sucesso!');
      },
      onError: (error: any) => {
        alert(`Erro ao criar caixa: ${error.response?.data?.detail || 'Erro desconhecido'}`);
      }
    }
  );

  const handleCreateBox = () => {
    if (!formData.supplier_id || !formData.box_number) {
      alert('Fornecedor e número da caixa são obrigatórios');
      return;
    }

    const boxData = {
      ...formData,
      supplier_id: parseInt(formData.supplier_id),
      capacity: formData.capacity ? parseFloat(formData.capacity) : null
    };

    createBox.mutate(boxData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponível':
        return 'bg-green-100 text-green-800';
      case 'em_uso':
        return 'bg-yellow-100 text-yellow-800';
      case 'danificada':
        return 'bg-red-100 text-red-800';
      case 'perdida':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponível':
        return 'Disponível';
      case 'em_uso':
        return 'Em Uso';
      case 'danificada':
        return 'Danificada';
      case 'perdida':
        return 'Perdida';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando caixas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caixas de Fornecedores</h1>
          <p className="text-gray-600">Gerencie as caixas dos fornecedores</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Caixa
        </button>
      </div>

      {/* Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boxes?.map((box) => (
          <div key={box.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Caixa #{box.box_number}</h3>
                <p className="text-sm text-gray-500">{box.supplier.name}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Truck className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 capitalize">{box.box_type}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Scale className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {box.current_weight.toFixed(1)}kg / {box.capacity ? `${box.capacity}kg` : 'N/A'}
                </span>
              </div>
            </div>
            
            {box.notes && (
              <p className="text-gray-600 text-sm mb-4">{box.notes}</p>
            )}
            
            <div className="flex justify-between items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(box.status)}`}>
                {getStatusText(box.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {boxes?.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma caixa encontrada
          </h3>
          <p className="text-gray-500">
            Crie caixas para rastrear os recipientes dos fornecedores.
          </p>
        </div>
      )}

      {/* Create Box Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Caixa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers?.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Caixa *
                </label>
                <input
                  type="text"
                  value={formData.box_number}
                  onChange={(e) => setFormData({...formData, box_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: 001, A1, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Caixa
                </label>
                <select
                  value={formData.box_type}
                  onChange={(e) => setFormData({...formData, box_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um tipo</option>
                  <option value="plástico">Plástico</option>
                  <option value="papelão">Papelão</option>
                  <option value="retornável">Retornável</option>
                  <option value="madeira">Madeira</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Observações sobre a caixa..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBox}
                disabled={createBox.isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {createBox.isLoading ? 'Criando...' : 'Criar Caixa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierBoxes; 