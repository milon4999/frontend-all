import React, { useEffect, useState } from 'react';
import { productsAPI } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const TestProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Testing products fetch...');
        const response = await productsAPI.getAll({ limit: 5 });
        console.log('Response:', response);
        setProducts(response.data.products || []);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Products Page</h1>
        
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Products ({products.length})</h2>
          {products.length > 0 ? (
            <ul>
              {products.map(product => (
                <li key={product._id} className="border-b py-2">
                  <strong>{product.name}</strong> - ${product.price}
                </li>
              ))}
            </ul>
          ) : (
            <p>No products found</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestProducts;
