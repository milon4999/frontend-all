import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const LayoutTest = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Layout Test Page</h1>
          <p className="text-gray-600 mb-4">
            This page is used to test the admin layout. If you can see this content properly 
            alongside the sidebar, the layout is working correctly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Test Card 1</h3>
              <p className="text-blue-700 text-sm">This is a test card to verify layout.</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Test Card 2</h3>
              <p className="text-green-700 text-sm">This is another test card.</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Test Card 3</h3>
              <p className="text-purple-700 text-sm">And one more test card.</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Layout Checklist:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Sidebar is visible on the left</li>
              <li>✅ Main content is visible on the right</li>
              <li>✅ Top navigation bar is present</li>
              <li>✅ Content is properly spaced</li>
              <li>✅ Responsive design works</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LayoutTest;
