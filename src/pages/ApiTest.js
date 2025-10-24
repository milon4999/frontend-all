import React, { useState, useEffect } from 'react';

const ApiTest = () => {
  const [apiStatus, setApiStatus] = useState('Testing...');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const API_URL = 'https://choiifashionbdbackend.onrender.com/api';
      
      // Test 1: Health check
      console.log('Testing health endpoint...');
      const healthResponse = await fetch(`${API_URL}/health`);
      const healthData = await healthResponse.json();
      console.log('Health check:', healthData);

      // Test 2: Products endpoint
      console.log('Testing products endpoint...');
      const productsResponse = await fetch(`${API_URL}/products?featured=true&limit=8`);
      const productsData = await productsResponse.json();
      console.log('Products response:', productsData);

      if (productsData.success && productsData.products) {
        setProducts(productsData.products);
        setApiStatus(`✅ API Working! Found ${productsData.products.length} products`);
      } else {
        setError('API returned unexpected format');
      }

    } catch (err) {
      console.error('API Test Error:', err);
      setError(err.message);
      setApiStatus('❌ API Failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">API Status:</h2>
        <p className="text-lg">{apiStatus}</p>
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || 'Not set'}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>

      {products.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Products from API:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product._id} className="border rounded-lg p-4 bg-white shadow">
                <img 
                  src={product.images[0]?.url || 'https://via.placeholder.com/200'} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">${product.price}</p>
                <p className="text-sm text-gray-500">Stock: {product.inventory.stock}</p>
                <p className="text-sm text-blue-500">Featured: {product.featured ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <button 
          onClick={testAPI}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test API Again
        </button>
      </div>
    </div>
  );
};

export default ApiTest;
