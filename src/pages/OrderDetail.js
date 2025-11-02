import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ordersAPI } from '../services/api';
import { Package } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(id);
        setOrder(response.data.order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order?._id) return;
    setCancelLoading(true);
    try {
      const response = await ordersAPI.cancel(order._id, {});
      setOrder(response.data.order);
      toast.success('Order cancelled successfully');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to cancel order';
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <div
        className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 pb-28 md:pb-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
      >
        Loading...
      </div>
    );
  }

  const shipping = order.shippingAddress || {};
  const contactLine = shipping.phone || '';
  const addressLine = shipping.address || '';
  const streetLine = shipping.street || '';
  const cityState = [shipping.city, shipping.state].filter(Boolean).join(', ');
  const postalLine = [cityState, shipping.zipCode].filter(Boolean).join(' ').trim();
  const countryLine = shipping.country || '';

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-28 md:pb-8"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <h1 className="text-3xl font-bold mb-2">Order Details</h1>
      <p className="text-gray-600 mb-8">Order #{order.orderNumber}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-bold mb-4">Shipping Address</h2>
          <p>{shipping.name}</p>
          {contactLine ? <p>{contactLine}</p> : null}
          {addressLine ? <p>{addressLine}</p> : null}
          {streetLine ? <p>{streetLine}</p> : null}
          {postalLine ? <p>{postalLine}</p> : null}
          {countryLine ? <p>{countryLine}</p> : null}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-bold mb-4">Order Status</h2>
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-5 w-5 text-primary-600" />
            <span className="capitalize font-semibold">{order.status}</span>
          </div>
          {order.status === 'pending' ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelLoading}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          ) : null}
          {order.tracking?.trackingNumber && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Tracking Number:</p>
              <p className="font-semibold">{order.tracking.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="font-bold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-4 border-b pb-4">
              <img
                src={item.image || item.product?.images?.[0]?.url}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.variant && <p className="text-sm text-gray-600">{item.variant}</p>}
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-pink-600">{formatPrice(
                  item.price * item.quantity,
                  item.currency || order.currency || item.product?.currency || 'USD'
                )}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="font-bold mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{formatPrice(
              order.pricing.subtotal,
              order.currency || order.items?.[0]?.currency || order.items?.[0]?.product?.currency || 'USD'
            )}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold">{formatPrice(
              order.pricing.shipping,
              order.currency || order.items?.[0]?.currency || order.items?.[0]?.product?.currency || 'USD'
            )}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="font-semibold">{formatPrice(
              order.pricing.tax,
              order.currency || order.items?.[0]?.currency || order.items?.[0]?.product?.currency || 'USD'
            )}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-pink-600">{formatPrice(
              order.pricing.total,
              order.currency || order.items?.[0]?.currency || order.items?.[0]?.product?.currency || 'USD'
            )}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
