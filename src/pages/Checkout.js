import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ordersAPI, couponsAPI } from '../services/api';
import { clearCart, updateQuantity } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { getPublicSettings } from '../utils/settings';
import { Minus } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import DeliveryAreaModal from '../components/DeliveryAreaModal';

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
    address: '',
    phone: user?.phone || ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState('');

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setSettingsVersion(v => v + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const [rawDeliveryOptions, setRawDeliveryOptions] = useState([]);

  useEffect(() => {
    const getOptions = () => {
      const settings = getPublicSettings();
      const adminSettings = localStorage.getItem('admin_settings');
      let methods = {};

      if (adminSettings) {
        try {
          const parsed = JSON.parse(adminSettings);
          methods = parsed.shipping?.methods || {};
        } catch (_) {}
      } else if (settings?.shipping?.methods) {
        methods = settings.shipping.methods;
      }

      const options = Object.entries(methods).map(([id, data]) => ({ id, ...data }));
      return options.filter(opt => opt.enabled);
    };
    
    setRawDeliveryOptions(getOptions());
  }, [settingsVersion]);

  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const displayDeliveryOptions = useMemo(() => {
    // Calculate per-product subtotals
    const productSubtotals = selectedItems.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + (item.price * item.quantity);
      return acc;
    }, {});

    // Check if any product qualifies for free shipping
    const hasUnconditionalFreeShipping = selectedItems.some(item => item.freeShipping && !item.freeShippingThreshold);
    
    const hasConditionalFreeShipping = selectedItems.some(item => 
      item.freeShipping && 
      item.freeShippingThreshold > 0 && 
      productSubtotals[item.productId] >= item.freeShippingThreshold
    );
    
    // Check if cart subtotal qualifies for free shipping from delivery method
    const freeDeliveryMethod = rawDeliveryOptions.find(opt => opt.freeAbove > 0 && subtotal >= opt.freeAbove);
    
    if (hasUnconditionalFreeShipping || hasConditionalFreeShipping || freeDeliveryMethod) {
      return [{ id: 'free_delivery', name: 'ফ্রি ডেলিভারি', price: 0, freeAbove: 0, enabled: true }];
    }
    return rawDeliveryOptions;
  }, [rawDeliveryOptions, subtotal, selectedItems]);

  useEffect(() => {
    const freeDeliveryAvailable = displayDeliveryOptions.some(opt => opt.id === 'free_delivery');
    const freeDeliveryIsSelected = selectedDelivery?.id === 'free_delivery';

    if (freeDeliveryAvailable && !freeDeliveryIsSelected) {
      setSelectedDelivery(displayDeliveryOptions.find(opt => opt.id === 'free_delivery'));
    } else if (!freeDeliveryAvailable && freeDeliveryIsSelected) {
      setSelectedDelivery(displayDeliveryOptions.length > 0 ? displayDeliveryOptions[0] : null);
    } else if (!selectedDelivery && displayDeliveryOptions.length > 0) {
      setSelectedDelivery(displayDeliveryOptions[0]);
    }
  }, [displayDeliveryOptions, selectedDelivery]);

  const shipping = useMemo(() => {
    // Case 1: A product has 'freeShipping' checked and no threshold (or threshold is 0).
    const hasUnconditionalFreeShipping = selectedItems.some(item => item.freeShipping && !item.freeShippingThreshold);
    if (hasUnconditionalFreeShipping) return 0;

    // Case 2: A product has 'freeShipping' checked and its subtotal meets the threshold.
    const productSubtotals = selectedItems.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + (item.price * item.quantity);
      return acc;
    }, {});

    const hasConditionalFreeShipping = selectedItems.some(item => 
      item.freeShipping && 
      item.freeShippingThreshold > 0 && 
      productSubtotals[item.productId] >= item.freeShippingThreshold
    );
    if (hasConditionalFreeShipping) return 0;

    // Case 3: The total cart subtotal meets the delivery method's threshold.
    if (selectedDelivery) {
      const price = Number(selectedDelivery.price || 0);
      const freeAbove = Number(selectedDelivery.freeAbove || 0);
      if (freeAbove > 0 && subtotal >= freeAbove) return 0;
      return price;
    }

    // Default to 0 if no delivery method is selected.
    return 0;
  }, [selectedItems, selectedDelivery, subtotal]);
  
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
  const buttonText = ['card', 'paypal'].includes(paymentMethod) ? 'Continue to Payment' : 'অর্ডার করুন';

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
    <>
      <DeliveryAreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        options={displayDeliveryOptions}
        subtotal={subtotal}
        selected={selectedDelivery}
        onSelect={(option) => {
          setSelectedDelivery(option);
          setIsModalOpen(false);
        }}
        currency={currency}
      />
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-28 md:pb-8"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
    >
      <h1 className="text-3xl font-bold mb-4 md:mb-8">Checkout</h1>

      

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
                  <span className="font-semibold">{formatPrice(item.price * item.quantity, item.currency || currency)}</span>
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
                <span className="font-semibold">{formatPrice(subtotal, currency)}</span>
              </div>
              {offerSavings > 0 ? (
                <div className="flex justify-between text-green-600">
                  <span>You saved (offers)</span>
                  <span>- {formatPrice(offerSavings, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
              </div>
              {taxSettings.enabled && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold">{formatPrice(tax, currency)}</span>
                </div>
              )}
              {discount > 0 ? (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {formatPrice(discount, currency)}</span>
                </div>
              ) : null}
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-extrabold text-pink-600">{formatPrice(total, currency)}</span>
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
            <h2 className="text-xl font-bold mb-4 text-pink-600">আপনার অর্ডারটি কনফার্ম করতে তথ্যগুলো পূরণ করে "অর্ডার করুন" বাটন এ ক্লিক করুন</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">আপনার নাম লিখুন *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">মোবাইল নাম্বার দিন *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা লিখুন *</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ডেলিভারি এরিয়া নিবার্চন করুন *</label>
                <button type="button" onClick={() => setIsModalOpen(true)} className="w-full p-3 border rounded-lg text-left">
                    {selectedDelivery ? `${selectedDelivery.name} - ${shipping === 0 ? 'Free' : formatPrice(shipping, currency)}` : 'Select Delivery Area'}
                </button>
            </div>


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
              className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition font-semibold mt-6 disabled:opacity-50"
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </div>
   </>
  );
};

export default Checkout;
