import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { MapPin, Package, Thermometer, AlertTriangle, Plus, Edit, Trash2, Warehouse } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  description: string;
  location_type: string;
  temperature: number | null;
  capacity: number | null;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  supplier: {
    name: string;
  };
}

interface ProductLocation {
  id: number;
  product_id: number;
  location_id: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  notes: string;
  product: Product;
  location: Location;
}

interface StockOverview {
  location: {
    id: number;
    name: string;
    type: string;
    temperature: number | null;
  };
  products: Array<{
    id: number;
    name: string;
    supplier: string;
    quantity: number;
    min_quantity: number;
    max_quantity: number;
    unit: string;
    notes: string;
  }>;
}

const Locations: React.FC = () => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingProductLocation, setEditingProductLocation] = useState<ProductLocation | null>(null);
  
  const [locationName, setLocationName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [locationType, setLocationType] = useState('deposito');
  const [locationTemperature, setLocationTemperature] = useState('');
  const [locationCapacity, setLocationCapacity] = useState('');
  
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [notes, setNotes] = useState('');
  
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>(
    'locations',
    async () => {
      const response = await api.get('/locations');
      return response.data;
    }
  );

  const { data: products } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    }
  );

  const { data: stockOverview } = useQuery<StockOverview[]>(
    'stock-overview',
    async () => {
      const response = await api.get('/locations/stock/overview');
      return response.data;
    }
  );

  const { data: lowStockProducts } = useQuery(
    'low-stock',
    async () => {
      const response = await api.get('/locations/stock/low-stock');
      return response.data;
    }
  );

  const createLocation = useMutation(
    async (locationData: any) => {
      const response = await api.post('/locations', locationData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries('stock-overview');
        setShowLocationModal(false);
        resetLocationForm();
      },
    }
  );

  const updateLocation = useMutation(
    async (locationData: any) => {
      const response = await api.put(`/locations/${editingLocation!.id}`, locationData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('locations');
        queryClient.invalidateQueries('stock-overview');
        setShowLocationModal(false);
        setEditingLocation(null);
        resetLocationForm();
      },
    }
  );

  const addProductToLocation = useMutation(
    async (productData: any) => {
      const response = await api.post(`/locations/${selectedLocation!.id}/products`, productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stock-overview');
        setShowProductModal(false);
        resetProductForm();
      },
    }
  );

  const updateProductLocation = useMutation(
    async (productData: any) => {
      const response = await api.put(`/locations/${selectedLocation!.id}/products/${editingProductLocation!.id}`, productData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stock-overview');
        setShowProductModal(false);
        setEditingProductLocation(null);
        resetProductForm();
      },
    }
  );

  const resetLocationForm = () => {
    setLocationName('');
    setLocationDescription('');
    setLocationType('deposito');
    setLocationTemperature('');
    setLocationCapacity('');
  };

  const resetProductForm = () => {
    setProductId('');
    setQuantity('');
    setMinQuantity('');
    setMaxQuantity('');
    setNotes('');
  };

  const handleLocationSubmit = () => {
    if (!locationName) {
      alert('Nome da localização é obrigatório');
      return;
    }

    const locationData = {
      name: locationName,
      description: locationDescription,
      location_type: locationType,
      temperature: locationTemperature ? parseFloat(locationTemperature) : null,
      capacity: locationCapacity ? parseFloat(locationCapacity) : null,
    };

    if (editingLocation) {
      updateLocation.mutate(locationData);
    } else {
      createLocation.mutate(locationData);
    }
  };

  const handleProductSubmit = () => {
    if (!productId || !quantity) {
      alert('Produto e quantidade são obrigatórios');
      return;
    }

    const productData = {
      product_id: parseInt(productId),
      quantity: parseFloat(quantity),
      min_quantity: minQuantity ? parseFloat(minQuantity) : 0,
      max_quantity: maxQuantity ? parseFloat(maxQuantity) : 0,
      notes: notes,
    };

    if (editingProductLocation) {
      updateProductLocation.mutate(productData);
    } else {
      addProductToLocation.mutate(productData);
    }
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'camara_fria':
        return <Thermometer className="h-4 w-4 text-blue-500" />;
      case 'congelador':
        return <Thermometer className="h-4 w-4 text-cyan-500" />;
      case 'area_externa':
        return <MapPin className="h-4 w-4 text-green-500" />;
      default:
        return <Warehouse className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLocationTypeText = (type: string) => {
    switch (type) {
      case 'camara_fria':
        return 'Câmara Fria';
      case 'congelador':
        return 'Congelador';
      case 'area_externa':
        return 'Área Externa';
      case 'prateleira':
        return 'Prateleira';
      default:
        return 'Depósito';
    }
  };

  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando estoque...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600">Gerencie o estoque por localização física</p>
        </div>
        <button
          onClick={() => {
            setEditingLocation(null);
            resetLocationForm();
            setShowLocationModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Localização
        </button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Produtos com Estoque Baixo: {lowStockProducts.length}
              </h3>
              <p className="text-yellow-700">
                Verifique os produtos que estão abaixo do estoque mínimo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visão geral do estoque */}
      <div className="space-y-4">
        {stockOverview?.map((locationStock) => (
          <div key={locationStock.location.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getLocationTypeIcon(locationStock.location.type)}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locationStock.location.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getLocationTypeText(locationStock.location.type)}
                    {locationStock.location.temperature && (
                      <span className="ml-2">
                        • {locationStock.location.temperature}°C
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedLocation(locationStock.location as any);
                    setEditingProductLocation(null);
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Adicionar Produto
                </button>
              </div>
            </div>

            {locationStock.products.length > 0 ? (
              <div className="space-y-3">
                {locationStock.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-500">
                            Fornecedor: {product.supplier} • {product.quantity} {product.unit}
                          </p>
                          {product.notes && (
                            <p className="text-sm text-gray-600 mt-1">{product.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-500">Mín:</span>
                            <span className={`ml-1 ${product.quantity <= product.min_quantity ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                              {product.min_quantity}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Máx:</span>
                            <span className="ml-1 text-gray-700">{product.max_quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedLocation(locationStock.location as any);
                          setEditingProductLocation({
                            id: 0,
                            product_id: product.id,
                            location_id: locationStock.location.id,
                            quantity: product.quantity,
                            min_quantity: product.min_quantity,
                            max_quantity: product.max_quantity,
                            notes: product.notes,
                            product: { id: product.id, name: product.name, unit: product.unit, supplier: { name: product.supplier } },
                            location: locationStock.location as any
                          });
                          setProductId(product.id.toString());
                          setQuantity(product.quantity.toString());
                          setMinQuantity(product.min_quantity.toString());
                          setMaxQuantity(product.max_quantity.toString());
                          setNotes(product.notes);
                          setShowProductModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum produto nesta localização</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Localização */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingLocation ? 'Editar Localização' : 'Nova Localização'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Localização *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: Câmara Fria 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Descrição da localização..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Localização
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="deposito">Depósito</option>
                  <option value="camara_fria">Câmara Fria</option>
                  <option value="congelador">Congelador</option>
                  <option value="area_externa">Área Externa</option>
                  <option value="prateleira">Prateleira</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={locationTemperature}
                  onChange={(e) => setLocationTemperature(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: 4.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (kg/unidades)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={locationCapacity}
                  onChange={(e) => setLocationCapacity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Capacidade máxima"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLocationSubmit}
                disabled={createLocation.isLoading || updateLocation.isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {createLocation.isLoading || updateLocation.isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Produto */}
      {showProductModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingProductLocation ? 'Editar Produto no Estoque' : 'Adicionar Produto ao Estoque'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Localização: {selectedLocation.name}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={!!editingProductLocation}
                >
                  <option value="">Selecione um produto</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Atual *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Máxima
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Observações sobre o produto nesta localização..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleProductSubmit}
                disabled={addProductToLocation.isLoading || updateProductLocation.isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {addProductToLocation.isLoading || updateProductLocation.isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations; 