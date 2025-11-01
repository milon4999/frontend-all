import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'react-toastify';
import { uploadAPI, settingsAPI } from '../../services/api';
import { Settings as SettingsIcon, CreditCard, Truck, Palette, Bell, Upload, Save, Image as ImageIcon, Facebook, Receipt, PlusCircle, Trash2 } from 'lucide-react';

const tabs = [
  { key: 'general', label: 'General', Icon: SettingsIcon },
  { key: 'payments', label: 'Payments', Icon: CreditCard },
  { key: 'shipping', label: 'Shipping', Icon: Truck },
  { key: 'tax', label: 'Tax', Icon: Receipt },
  { key: 'appearance', label: 'Appearance', Icon: Palette },
  { key: 'social', label: 'Social', Icon: Facebook },
  { key: 'notifications', label: 'Notifications', Icon: Bell }
];

const defaultSettings = {
  shopName: '',
  email: '',
  phone: '',
  address: '',
  currency: 'USD',
  timezone: 'UTC',
  logo: '',
  theme: 'light',
  primaryColor: 'from-blue-500 to-purple-600',
  payments: {
    stripeEnabled: true,
    codEnabled: true,
    paypalEnabled: false,
    bankEnabled: false,
    localEnabled: false,
    socialEnabled: false,
    stripePublicKey: ''
  },
  shipping: {
    enableFreeShipping: false,
    freeShippingThreshold: 0,
    flatRate: 0,
    methods: {
      standard: {
        enabled: true,
        name: 'Standard',
        price: 10,
        freeAbove: 50
      },
      express: {
        enabled: true,
        name: 'Express',
        price: 20,
        freeAbove: 0
      }
    }
  },
  tax: {
    enabled: true,
    rate: 10
  },
  notifications: {
    orderEmails: true,
    lowStockEmails: true,
    senderEmail: ''
  },
  social: {
    facebookUrl: '',
    whatsappUrl: ''
  }
};

const Settings = () => {
  const [active, setActive] = useState('general');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await settingsAPI.get();
        const data = res?.data?.settings || {};
        if (mounted) setSettings({ ...defaultSettings, ...data });
      } catch (_) {
        const saved = localStorage.getItem('admin_settings');
        if (saved) {
          try { if (mounted) setSettings({ ...defaultSettings, ...JSON.parse(saved) }); } catch (_) {}
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await settingsAPI.update(settings);
      const saved = res?.data?.settings || settings;
      localStorage.setItem('admin_settings', JSON.stringify(saved));
      localStorage.setItem('public_settings', JSON.stringify({ social: saved.social || {}, payments: saved.payments || {}, tax: saved.tax || {}, shipping: saved.shipping || {}, updatedAt: new Date().toISOString() }));
      toast.success('Settings saved');
    } catch (_) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadAPI.uploadImage(fd);
      setSettings((s) => ({ ...s, logo: res.data.url }));
      toast.success('Logo uploaded');
    } catch (_) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const Input = ({ label, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input {...props} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
  );

  const Switch = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between p-3 border rounded-lg">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </label>
  );

  const Section = ({ title, children, actions }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  const General = () => (
    <div className="space-y-6">
      <Section title="Store Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Store Name" value={settings.shopName} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} />
          <Input label="Support Email" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          <Input label="Phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          <Input label="Address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BDT">BDT</option>
              <option value="INR">INR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="UTC">UTC</option>
              <option value="Asia/Dhaka">Asia/Dhaka</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Branding" actions={
        <button onClick={() => setSettings({ ...settings, logo: '' })} className="text-sm text-gray-600 hover:text-gray-800">Remove Logo</button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center space-x-4">
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
              <button type="button" disabled={uploading} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg disabled:opacity-50">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
          <div>
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="h-16 object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/160x64?text=Logo'; }} />
              ) : (
                <div className="text-center text-gray-500">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">No logo uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  const Payments = () => (
    <div className="space-y-6">
      <Section title="Providers">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Switch label="Enable Stripe" checked={settings.payments.stripeEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, stripeEnabled: v } })} />
          <Switch label="Enable Cash on Delivery" checked={settings.payments.codEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, codEnabled: v } })} />
          <Switch label="Enable PayPal" checked={settings.payments.paypalEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, paypalEnabled: v } })} />
          <Switch label="Enable Bank Transfer" checked={settings.payments.bankEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, bankEnabled: v } })} />
          <Switch label="Enable Local Payment" checked={settings.payments.localEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, localEnabled: v } })} />
          <Switch label="Enable Social Payment" checked={settings.payments.socialEnabled} onChange={(v) => setSettings({ ...settings, payments: { ...settings.payments, socialEnabled: v } })} />
        </div>
      </Section>
      <Section title="Stripe">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Publishable Key" value={settings.payments.stripePublicKey} onChange={(e) => setSettings({ ...settings, payments: { ...settings.payments, stripePublicKey: e.target.value } })} />
        </div>
      </Section>
    </div>
  );

  const Shipping = () => {
    const deleteMethod = (id) => {
      const { [id]: _, ...rest } = settings.shipping.methods;
      setSettings(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          methods: rest
        }
      }));
    };

    const addMethod = () => {
      const newId = `method_${Date.now()}`;
      setSettings(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          methods: {
            ...prev.shipping.methods,
            [newId]: { name: 'New Method', price: 0, freeAbove: 0, enabled: true }
          }
        }
      }));
    };

    const handleMethodChange = (id, field, value) => {
      setSettings(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          methods: {
            ...prev.shipping.methods,
            [id]: { ...prev.shipping.methods[id], [field]: value }
          }
        }
      }));
    };

    return (
      <div className="space-y-6">
        <Section title="Delivery Methods" actions={<button onClick={addMethod} className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"><PlusCircle className="h-4 w-4 mr-1" /> Add Method</button>}>
          <div className="space-y-6">
            {Object.entries(settings.shipping.methods || {}).map(([id, method]) => (
              <div key={id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900 capitalize">{id.replace(/_/g, ' ')}</h4>
                    <button onClick={() => deleteMethod(id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Switch 
                    label="" 
                    checked={method.enabled ?? true} 
                    onChange={(v) => handleMethodChange(id, 'enabled', v)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Display Name" 
                    value={method.name || ''} 
                    onChange={(e) => handleMethodChange(id, 'name', e.target.value)}
                  />
                  <Input 
                    label="Price" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={method.price ?? 0} 
                    onChange={(e) => handleMethodChange(id, 'price', Number(e.target.value))}
                  />
                  <Input 
                    label="Free Above (Subtotal)" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={method.freeAbove ?? 0} 
                    onChange={(e) => handleMethodChange(id, 'freeAbove', Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Set "Free Above" to 0 to never offer free shipping for that method. 
              Disabled methods will not appear in checkout.
            </p>
          </div>
        </Section>
      </div>
    );
  };

  const Appearance = () => (
    <div className="space-y-6">
      <Section title="Theme">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Gradient</label>
            <div className="grid grid-cols-6 gap-2">
              {['from-blue-500 to-purple-600','from-green-500 to-emerald-600','from-orange-500 to-rose-600','from-indigo-500 to-blue-600','from-pink-500 to-fuchsia-600','from-teal-500 to-cyan-600'].map((g) => (
                <button key={g} type="button" onClick={() => setSettings({ ...settings, primaryColor: g })} className={`h-10 rounded-lg bg-gradient-to-r ${g} ${settings.primaryColor === g ? 'ring-4 ring-blue-500' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  const Notifications = () => (
    <div className="space-y-6">
      <Section title="Email">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Sender Email" type="email" value={settings.notifications.senderEmail} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, senderEmail: e.target.value } })} />
          <Switch label="Order Emails" checked={settings.notifications.orderEmails} onChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, orderEmails: v } })} />
          <Switch label="Low Stock Emails" checked={settings.notifications.lowStockEmails} onChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, lowStockEmails: v } })} />
        </div>
      </Section>
    </div>
  );

  const Tax = () => (
    <div className="space-y-6">
      <Section title="Tax Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Switch 
            label="Enable Tax" 
            checked={settings.tax?.enabled ?? true} 
            onChange={(v) => setSettings({ ...settings, tax: { ...settings.tax, enabled: v } })} 
          />
          <Input 
            label="Tax Rate (%)" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01"
            value={settings.tax?.rate ?? 10} 
            onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, rate: Number(e.target.value) } })} 
            disabled={!settings.tax?.enabled}
          />
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Tax will be calculated as {settings.tax?.rate ?? 10}% of the subtotal. 
            {!settings.tax?.enabled && ' Tax is currently disabled and will not be applied to orders.'}
          </p>
        </div>
      </Section>
    </div>
  );

  const Social = () => (
    <div className="space-y-6">
      <Section title="Social Links">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Facebook Page URL"
            type="url"
            placeholder="https://www.facebook.com/yourpage"
            value={settings.social?.facebookUrl || ''}
            onChange={(e) => setSettings({ ...settings, social: { ...settings.social, facebookUrl: e.target.value } })}
          />
          <Input
            label="WhatsApp URL or Number"
            type="text"
            placeholder="https://wa.me/1234567890 or +8801XXXXXXXXX"
            value={settings.social?.whatsappUrl || ''}
            onChange={(e) => setSettings({ ...settings, social: { ...settings.social, whatsappUrl: e.target.value } })}
          />
        </div>
      </Section>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your store configuration</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button onClick={() => setSettings(defaultSettings)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Reset</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-1 p-2 border-b">
            {tabs.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActive(key)} className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${active === key ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {active === 'general' && <General />}
            {active === 'payments' && <Payments />}
            {active === 'shipping' && <Shipping />}
            {active === 'tax' && <Tax />}
            {active === 'appearance' && <Appearance />}
            {active === 'social' && <Social />}
            {active === 'notifications' && <Notifications />}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
