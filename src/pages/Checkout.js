import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ordersAPI, couponsAPI } from '../services/api';
import { clearCart, updateQuantity } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { getPublicSettings } from '../utils/settings';
import { Minus } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const Checkout = () => {
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const keyOf = (i) => `${i.productId}-${i.variant || ''}`;
  const [buyNowItem, setBuyNowItem] = useState(() => location.state?.buyNowItem || null);
  const isBuyNow = !!buyNowItem;
  const cartItems = useMemo(() => {
    if (isBuyNow) return [buyNowItem];
    const all = Array.isArray(items) ? items : [];
    const keys = location.state?.selectedKeys || [];
    return keys.length ? all.filter((i) => keys.includes(keyOf(i))) : all;
  }, [items, location.state, isBuyNow, buyNowItem]);

  const [selectedKeys, setSelectedKeys] = useState(() => cartItems.map(keyOf));
  const selectedItems = useMemo(
    () => cartItems.filter((i) => selectedKeys.includes(keyOf(i))),
    [cartItems, selectedKeys]
  );
  const currency = selectedItems[0]?.currency || cartItems[0]?.currency || buyNowItem?.currency || 'USD';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: user?.phone || ''
  });

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState('');

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Get delivery methods from admin settings
  const deliveryMethods = useMemo(() => {
    const settings = getPublicSettings();
    const adminSettings = localStorage.getItem('admin_settings');
    let methods = {};
    
    if (adminSettings) {
      try {
        const parsed = JSON.parse(adminSettings);
        methods = parsed.shipping?.methods || {};
      } catch (_) {}
    }
    
    // If no methods found in admin settings, try public settings
    if (Object.keys(methods).length === 0) {
      methods = settings?.shipping?.methods || {};
    }
    
    // If still no methods, use defaults
    if (Object.keys(methods).length === 0) {
      methods = {
        standard: { enabled: true, name: 'Standard', price: 10, freeAbove: 50 },
        express: { enabled: true, name: 'Express', price: 20, freeAbove: 0 }
      };
    }
    
    return methods;
  }, []);
  
  // Get enabled delivery methods
  const enabledDeliveryMethods = useMemo(() => {
    const methods = [];
    if (deliveryMethods.standard?.enabled !== false) {
      methods.push({ id: 'standard', ...deliveryMethods.standard });
    }
    if (deliveryMethods.express?.enabled !== false) {
      methods.push({ id: 'express', ...deliveryMethods.express });
    }
    return methods;
  }, [deliveryMethods]);
  
  const [shippingMethod, setShippingMethod] = useState(() => enabledDeliveryMethods[0]?.id || 'standard');
  
  // Calculate shipping cost based on selected method
  const shipping = useMemo(() => {
    const method = deliveryMethods[shippingMethod];
    if (!method) return 0;
    const price = Number(method.price || 0);
    const freeAbove = Number(method.freeAbove || 0);
    return freeAbove > 0 && subtotal >= freeAbove ? 0 : price;
  }, [shippingMethod, subtotal, deliveryMethods]);
  
  // Get tax settings from admin panel
  const taxSettings = useMemo(() => {
    const settings = getPublicSettings();
    const adminSettings = localStorage.getItem('admin_settings');
    if (adminSettings) {
      try {
        const parsed = JSON.parse(adminSettings);
        return parsed.tax || { enabled: true, rate: 10 };
      } catch (_) {}
    }
    return settings?.tax || { enabled: true, rate: 10 };
  }, []);
  
  const tax = taxSettings.enabled ? subtotal * (taxSettings.rate / 100) : 0;
  const total = subtotal + shipping + tax - discount;

  const offerSavings = useMemo(() => {
    return selectedItems.reduce((sum, it) => {
      const cp = Number(it.comparePrice || 0);
      const p = Number(it.price || 0);
      const q = Number(it.quantity || 0);
      return sum + Math.max(0, (cp - p)) * q;
    }, 0);
  }, [selectedItems]);

  // Payment methods from public settings (admin-controlled)
  const enabledMethods = useMemo(() => {
    const cfg = getPublicSettings()?.payments || {};
    const list = [];
    if (cfg.stripeEnabled) list.push({ id: 'card', label: 'Card (Stripe)' });
    if (cfg.paypalEnabled) list.push({ id: 'paypal', label: 'PayPal' });
    if (cfg.bankEnabled) list.push({ id: 'bank', label: 'Bank Transfer' });
    if (cfg.localEnabled) list.push({ id: 'local', label: 'Local Payment' });
    if (cfg.codEnabled) list.push({ id: 'cod', label: 'Cash on Delivery' });
    if (cfg.socialEnabled) list.push({ id: 'social', label: 'Social' });
    return list;
  }, []);

  const [paymentMethod, setPaymentMethod] = useState(() => enabledMethods[0]?.id || 'cod');
  const buttonText = ['card', 'paypal'].includes(paymentMethod) ? 'Continue to Payment' : 'Place Order';

  const applyCoupon = async () => {
    const code = (couponCode || '').trim().toUpperCase();
    if (!code) {
      setCouponStatus('Enter a coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    try {
      const res = await couponsAPI.validate({
        code,
        cartTotal: subtotal,
        products: selectedItems.map((it) => it.productId)
      });
      const c = res?.data?.coupon;
      if (!c) throw new Error('Invalid coupon');
      const d = Math.min(Number(c.discount || 0), subtotal);
      setDiscount(Number(d.toFixed(2)));
      setAppliedCoupon({ code: c.code, discount: Number(d.toFixed(2)), discountType: c.discountType, discountValue: c.discountValue });
      const label = c.discountType === 'percentage'
        ? `${c.discountValue}% off applied`
        : `${formatPrice(c.discount, currency)} off applied`;
      setCouponStatus(label);
    } catch (err) {
      setAppliedCoupon(null);
      setDiscount(0);
      const msg = err?.response?.data?.message || 'Invalid coupon';
      setCouponStatus(msg);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setCouponStatus('');
    setAppliedCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const orderData = {
        items: selectedItems.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          variant: item.variant,
          image: item.image || undefined
        })),
        shippingAddress: formData,
        payment: {
          method: paymentMethod,
          status: 'pending'
        },
        pricing: {
          subtotal,
          shipping,
          tax,
          discount,
          total
        },
        ...(appliedCoupon ? { coupon: { code: appliedCoupon.code, discount: discount } } : {})
      };

      const response = await ordersAPI.create(orderData);
      
      if (response.data.success) {
        if (!isBuyNow) {
          dispatch(clearCart());
        }
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.data.order._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-28 md:pb-8"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <h1 className="text-3xl font-bold mb-4 md:mb-8">Checkout</h1>

      
      {enabledDeliveryMethods.length > 0 && (
        <div className="block lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-3">Delivery Method</h2>
            <div className="grid grid-cols-1 gap-3">
              {enabledDeliveryMethods.map((method) => {
                const price = Number(method.price || 0);
                const freeAbove = Number(method.freeAbove || 0);
                const isFree = freeAbove > 0 && subtotal >= freeAbove;
                return (
                  <label key={method.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${shippingMethod === method.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-2">
                      <input type="radio" name="shipping-mobile" value={method.id} checked={shippingMethod === method.id} onChange={() => setShippingMethod(method.id)} />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{isFree ? 'Free' : formatPrice(price, currency)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="order-1 lg:order-2 lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">{selectedItems.length} item(s)</span>
              <Link to="/cart" className="text-sm text-primary-600 hover:text-primary-700">Edit cart</Link>
            </div>
            
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    {!isBuyNow ? (
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(keyOf(item))}
                        onChange={() => {
                          const k = keyOf(item);
                          setSelectedKeys((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
                        }}
                      />
                    ) : null}
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <div className="font-medium truncate max-w-[180px]">{item.name}</div>
                      {item.variant ? <div className="text-xs text-gray-500 truncate">{item.variant}</div> : null}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        {!isBuyNow ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                dispatch(updateQuantity({ productId: item.productId, variant: item.variant, quantity: item.quantity - 1 }));
                              }
                            }}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBuyNowItem((prev) => {
                                if (!prev) return prev;
                                if (keyOf(prev) !== keyOf(item)) return prev;
                                return { ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) };
                              });
                            }}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {Number(item.comparePrice || 0) > Number(item.price || 0) ? (
                        <div className="text-[11px] text-green-600">Save {formatPrice((item.comparePrice - item.price) * item.quantity, item.currency || currency)}</div>
                      ) : null}
                    </div>
                  </div>
                  <span>{formatPrice(item.price * item.quantity, item.currency || currency)}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="button" onClick={applyCoupon} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Apply</button>
                {discount > 0 ? (
                  <button type="button" onClick={clearCoupon} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Remove</button>
                ) : null}
              </div>
              {couponStatus ? (
                <div className={`text-xs ${couponStatus.includes('Invalid') ? 'text-red-600' : 'text-green-600'}`}>{couponStatus}</div>
              ) : null}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {offerSavings > 0 ? (
                <div className="flex justify-between text-green-600">
                  <span>You saved (offers)</span>
                  <span>- {formatPrice(offerSavings, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
              </div>
              {taxSettings.enabled && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(tax, currency)}</span>
                </div>
              )}
              {discount > 0 ? (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {formatPrice(discount, currency)}</span>
                </div>
              ) : null}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="order-2 lg:hidden">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-bold mb-3">Payment Method</h2>
            {enabledMethods.length === 0 ? (
              <div className="p-3 border rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                No payment methods are available. Please contact support.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {enabledMethods.map((m) => (
                  <label key={m.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${paymentMethod === m.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                      />
                      <span className="font-medium">{m.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{m.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="order-3 lg:order-1 lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {enabledDeliveryMethods.length > 0 && (
              <div className="pt-2 hidden lg:block">
                <h2 className="text-xl font-bold mb-3">Delivery Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {enabledDeliveryMethods.map((method) => {
                    const price = Number(method.price || 0);
                    const freeAbove = Number(method.freeAbove || 0);
                    const isFree = freeAbove > 0 && subtotal >= freeAbove;
                    return (
                      <label key={method.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${shippingMethod === method.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-2">
                          <input type="radio" name="shipping" value={method.id} checked={shippingMethod === method.id} onChange={() => setShippingMethod(method.id)} />
                          <span className="font-medium">{method.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{isFree ? 'Free' : formatPrice(price, currency)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 hidden lg:block">
              <h2 className="text-xl font-bold mb-3">Payment Method</h2>
              {enabledMethods.length === 0 ? (
                <div className="p-3 border rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                  No payment methods are available. Please contact support.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {enabledMethods.map((m) => (
                    <label key={m.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${paymentMethod === m.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payment"
                          value={m.id}
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                        />
                        <span className="font-medium">{m.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{m.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-semibold mt-6 disabled:opacity-50"
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
