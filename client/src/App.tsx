import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import PDV from './pages/PDV';
import AccountsReceivable from './pages/AccountsReceivable';
import Users from './pages/Users';
import Locations from './pages/Locations';
import SupplierBoxes from './pages/SupplierBoxes';
import Layout from './components/Layout';

const queryClient = new QueryClient();

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Carregando...</div>; // Ou um spinner
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (user?.role !== 'admin') {
    return <Navigate to="/pdv" />; // Redireciona vendedores para o PDV
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/pdv" />} />
                <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
                <Route path="suppliers" element={<AdminRoute><Suppliers /></AdminRoute>} />
                <Route path="pdv" element={<PDV />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sales" element={<Sales />} />
                <Route path="accounts-receivable" element={<AccountsReceivable />} />
                <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="locations" element={<AdminRoute><Locations /></AdminRoute>} />
                <Route path="supplier-boxes" element={<AdminRoute><SupplierBoxes /></AdminRoute>} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 