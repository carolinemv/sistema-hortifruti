import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  category: string;
  supplier: {
    id: number;
    name: string;
  };
}

const Products: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
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

  const createProduct = useMutation(
    async (productData: any) => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setShowModal(false);
      },
    }
  );

  const updateProduct = useMutation(
    async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setShowModal(false);
        setEditingProduct(null);
      },
    }
  );

  const deleteProduct = useMutation(
    async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      cost_price: parseFloat(formData.get('cost_price') as string),
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      min_stock: parseInt(formData.get('min_stock') as string),
      unit: formData.get('unit') as string,
      category: formData.get('category') as string,
      supplier_id: parseInt(formData.get('supplier_id') as string),
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProduct.mutate(productData);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seus produtos e estoque</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteProduct.mutate(product.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{product.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Preço:</span>
                <span className="font-medium">R$ {product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estoque:</span>
                <span className={`font-medium ${product.stock_quantity <= product.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock_quantity} {product.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fornecedor:</span>
                <span className="font-medium">{product.supplier.name}</span>
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
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={editingProduct?.price}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_price"
                    defaultValue={editingProduct?.cost_price}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    defaultValue={editingProduct?.stock_quantity}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                  <input
                    type="number"
                    name="min_stock"
                    defaultValue={editingProduct?.min_stock}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidade</label>
                  <select
                    name="unit"
                    defaultValue={editingProduct?.unit}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="unidade">unidade</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingProduct?.category}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                <select
                  name="supplier_id"
                  defaultValue={editingProduct?.supplier_id}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers?.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
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
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products; 