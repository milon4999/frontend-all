import React from 'react';
import { formatPrice } from '../utils/currency';

const DeliveryAreaModal = ({ isOpen, onClose, options, selected, onSelect, currency, subtotal }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">ডেলিভারি এরিয়া নিবার্চন করুন</h2>
        <div className="space-y-3">
          {options.map((option) => {
            const price = Number(option.price || 0);
            const freeAbove = Number(option.freeAbove || 0);
            const isFree = (freeAbove > 0 && subtotal >= freeAbove) || option.id === 'free_delivery' || price === 0;
            return (
            <label
              key={option.id}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                selected?.id === option.id
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="delivery-option"
                  value={option.id}
                  checked={selected?.id === option.id}
                  onChange={() => onSelect(option)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="font-medium text-lg">{option.name}</span>
              </div>
              <span className="text-base font-semibold">{isFree ? 'Free' : formatPrice(price, currency)}</span>
            </label>
          )})}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAreaModal;
