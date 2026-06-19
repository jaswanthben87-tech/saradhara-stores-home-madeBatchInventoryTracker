import { useState, useEffect } from 'react'
import logoImg from './assets/logo.png'

const getDefaultUnit = (dbUnit) => {
  const u = (dbUnit || '').toLowerCase();
  if (u === 'liters' || u === 'liter' || u === 'lit' || u === 'ml') {
    return 'lit';
  }
  if (u === 'g' || u === 'gm') {
    return 'gm';
  }
  if (u === 'units' || u === 'unit') {
    return 'units';
  }
  return 'kg';
};

const getAvailableUnits = (dbUnit) => {
  const u = (dbUnit || '').toLowerCase();
  if (u === 'liters' || u === 'liter' || u === 'lit' || u === 'ml') {
    return ['lit', 'ml'];
  }
  if (u === 'units' || u === 'unit') {
    return ['units'];
  }
  return ['kg', 'gm'];
};

const convertToDbValue = (value, unit, dbUnit) => {
  const val = parseFloat(value || 0);
  const u = (unit || '').toLowerCase();
  const dbU = (dbUnit || '').toLowerCase();
  
  if (dbU === 'liters' || dbU === 'liter' || dbU === 'lit') {
    if (u === 'ml') return val / 1000.0;
    return val;
  }
  if (dbU === 'ml') {
    if (u === 'lit') return val * 1000.0;
    return val;
  }
  if (dbU === 'kg') {
    if (u === 'gm' || u === 'g') return val / 1000.0;
    return val;
  }
  if (dbU === 'g' || dbU === 'gm') {
    if (u === 'kg') return val * 1000.0;
    return val;
  }
};

const convertToFrontendValue = (dbValue, dbUnit) => {
  const val = parseFloat(dbValue || 0);
  const dbU = (dbUnit || '').toLowerCase();
  
  if (dbU === 'liters' || dbU === 'liter' || dbU === 'lit') {
    if (val < 1 || val % 1 !== 0) {
      return { value: Math.round(val * 1000), unit: 'ml' };
    }
    return { value: Math.round(val), unit: 'lit' };
  }
  if (dbU === 'ml') {
    return { value: Math.round(val), unit: 'ml' };
  }
  if (dbU === 'kg') {
    if (val < 1 || val % 1 !== 0) {
      return { value: Math.round(val * 1000), unit: 'gm' };
    }
    return { value: Math.round(val), unit: 'kg' };
  }
  if (dbU === 'g' || dbU === 'gm') {
    return { value: Math.round(val), unit: 'gm' };
  }
  return { value: Math.round(val), unit: 'units' };
};

const parseAddress = (addressStr) => {
  const parts = {
    flat: '',
    area: '',
    pincode: '',
    city: '',
    state: ''
  };
  if (!addressStr) return parts;
  
  // Try splitting by newline first
  const lines = addressStr.split('\n');
  if (lines.length >= 5) {
    parts.flat = lines[0].trim();
    parts.area = lines[1].trim();
    parts.pincode = lines[2].trim();
    parts.city = lines[3].trim();
    parts.state = lines[4].trim();
    return parts;
  }
  
  // Fallback: split by comma if no newlines but at least 5 parts
  const commaParts = addressStr.split(',');
  if (commaParts.length >= 5) {
    parts.state = commaParts[commaParts.length - 1].trim();
    parts.city = commaParts[commaParts.length - 2].trim();
    parts.pincode = commaParts[commaParts.length - 3].trim();
    parts.area = commaParts[commaParts.length - 4].trim();
    parts.flat = commaParts.slice(0, commaParts.length - 4).join(',').trim();
    return parts;
  }
  
  // Otherwise, put the entire string into the flat/house no field
  parts.flat = addressStr.trim();
  return parts;
};

const parseAddressBook = (addressFieldVal) => {
  if (!addressFieldVal) return [];
  try {
    const book = JSON.parse(addressFieldVal);
    if (Array.isArray(book)) {
      return book;
    }
  } catch (e) {
    // Plain text / legacy address fallback
    const parsed = parseAddress(addressFieldVal);
    return [{
      id: 'default',
      flat: parsed.flat,
      area: parsed.area,
      pincode: parsed.pincode,
      city: parsed.city,
      state: parsed.state,
      isDefault: true
    }];
  }
  return [];
};

export default function App() {
  // Credentials States
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerAddress, setRegisterAddress] = useState('')

  // Settings States
  const [settingsFirstName, setSettingsFirstName] = useState('')
  const [settingsLastName, setSettingsLastName] = useState('')
  const [settingsPhone, setSettingsPhone] = useState('')
  const [settingsEmail, setSettingsEmail] = useState('')
  const [isSettingsEditMode, setIsSettingsEditMode] = useState(false)

  // Address Book Form States
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressFormFlat, setAddressFormFlat] = useState('')
  const [addressFormArea, setAddressFormArea] = useState('')
  const [addressFormPincode, setAddressFormPincode] = useState('')
  const [addressFormCity, setAddressFormCity] = useState('')
  const [addressFormState, setAddressFormState] = useState('')

  // Cart Address Form States
  const [isCartAddressFormOpen, setIsCartAddressFormOpen] = useState(false)
  const [cartFormFlat, setCartFormFlat] = useState('')
  const [cartFormArea, setCartFormArea] = useState('')
  const [cartFormPincode, setCartFormPincode] = useState('')
  const [cartFormCity, setCartFormCity] = useState('')
  const [cartFormState, setCartFormState] = useState('')

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }, [theme])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null')
    } catch {
      return null
    }
  })

  // Address Book States and Handlers
  const [addressBook, setAddressBook] = useState([])
  
  useEffect(() => {
    if (currentUser) {
      setAddressBook(parseAddressBook(currentUser.address || ''))
    } else {
      setAddressBook([])
    }
  }, [currentUser])

  const saveAddressBook = async (newBook) => {
    const serialized = JSON.stringify(newBook)
    try {
      const res = await fetch('/api/customers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.customer_id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          address: serialized
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const updatedUser = {
          ...currentUser,
          address: data.customer.address
        }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
        setAddressBook(newBook)
        showToast('Address book updated successfully!', 'success')
      } else {
        showToast(data.error || 'Failed to update address book.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during address book update.', 'danger')
    }
  }

  const handleAddAddressClick = () => {
    setEditingAddressId(null)
    setAddressFormFlat('')
    setAddressFormArea('')
    setAddressFormPincode('')
    setAddressFormCity('')
    setAddressFormState('')
    setIsAddressFormOpen(true)
  }

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id)
    setAddressFormFlat(addr.flat)
    setAddressFormArea(addr.area)
    setAddressFormPincode(addr.pincode)
    setAddressFormCity(addr.city)
    setAddressFormState(addr.state)
    setIsAddressFormOpen(true)
  }

  const handleSaveAddressBookItem = async () => {
    if (
      !addressFormFlat.trim() ||
      !addressFormArea.trim() ||
      !addressFormPincode.trim() ||
      !addressFormCity.trim() ||
      !addressFormState.trim()
    ) {
      showToast('All address fields are required.', 'danger')
      return
    }
    
    let newBook = [...addressBook]
    if (editingAddressId === null) {
      const newAddr = {
        id: Date.now(),
        flat: addressFormFlat.trim(),
        area: addressFormArea.trim(),
        pincode: addressFormPincode.trim(),
        city: addressFormCity.trim(),
        state: addressFormState.trim(),
        isDefault: addressBook.length === 0
      }
      newBook.push(newAddr)
    } else {
      newBook = newBook.map(addr => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            flat: addressFormFlat.trim(),
            area: addressFormArea.trim(),
            pincode: addressFormPincode.trim(),
            city: addressFormCity.trim(),
            state: addressFormState.trim()
          }
        }
        return addr
      })
    }
    
    await saveAddressBook(newBook)
    setIsAddressFormOpen(false)
    setEditingAddressId(null)
  }

  const handleDeleteAddressItem = async (addrId) => {
    const addrToDelete = addressBook.find(a => a.id === addrId)
    let newBook = addressBook.filter(addr => addr.id !== addrId)
    
    if (addrToDelete && addrToDelete.isDefault && newBook.length > 0) {
      newBook[0].isDefault = true
    }
    
    await saveAddressBook(newBook)
  }

  const handleSetDefaultAddress = async (addrId) => {
    const newBook = addressBook.map(addr => ({
      ...addr,
      isDefault: addr.id === addrId
    }))
    await saveAddressBook(newBook)
  }

  const handleSaveCartAddressBookItem = async () => {
    if (
      !cartFormFlat.trim() ||
      !cartFormArea.trim() ||
      !cartFormPincode.trim() ||
      !cartFormCity.trim() ||
      !cartFormState.trim()
    ) {
      showToast('All address fields are required.', 'danger')
      return
    }

    const newAddr = {
      id: Date.now(),
      flat: cartFormFlat.trim(),
      area: cartFormArea.trim(),
      pincode: cartFormPincode.trim(),
      city: cartFormCity.trim(),
      state: cartFormState.trim(),
      isDefault: addressBook.length === 0
    }

    const newBook = [...addressBook, newAddr]
    await saveAddressBook(newBook)

    // Automatically select the newly created address for the checkout
    setSelectedCartAddressId(String(newAddr.id));
    setCartAddressFlat(newAddr.flat);
    setCartAddressArea(newAddr.area);
    setCartAddressPincode(newAddr.pincode);
    setCartAddressCity(newAddr.city);
    setCartAddressState(newAddr.state);

    // Reset cart form states
    setCartFormFlat('')
    setCartFormArea('')
    setCartFormPincode('')
    setCartFormCity('')
    setCartFormState('')
    setIsCartAddressFormOpen(false)
  }

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = sessionStorage.getItem('activeTab')
      if (savedTab) return savedTab
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
      if (user && user.role === 'admin') {
        return 'admin'
      }
    } catch {}
    return 'ecommerce'
  })

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  // 1. Sync URL path to activeTab / login state when component mounts and on popstate
  useEffect(() => {
    const syncRouteWithUrl = () => {
      const path = window.location.pathname;
      const user = currentUser;
      
      if (!user) {
        if (path !== '/') {
          window.history.replaceState(null, '', '/');
        }
        return;
      }
      
      // User is logged in
      if (user.role === 'admin') {
        if (path !== '/app/admin') {
          window.history.replaceState(null, '', '/app/admin');
        }
        setActiveTab('admin');
        return;
      }
      
      // Customer role
      if (path.startsWith('/app/')) {
        const subPath = path.substring(5); // Get part after /app/
        if (subPath === 'admin') {
          // Customers cannot view admin, redirect to store
          window.history.replaceState(null, '', '/app/store');
          setActiveTab('ecommerce');
        } else if (['store', 'cart', 'my-orders', 'settings', 'ai-assistant'].includes(subPath)) {
          const tabMap = {
            'store': 'ecommerce',
            'cart': 'cart',
            'my-orders': 'my-orders',
            'settings': 'settings',
            'ai-assistant': 'ai-assistant'
          };
          setActiveTab(tabMap[subPath]);
        } else {
          // Unknown subpath, fallback to store
          window.history.replaceState(null, '', '/app/store');
          setActiveTab('ecommerce');
        }
      } else {
        // Not starting with /app/, redirect to store
        window.history.replaceState(null, '', '/app/store');
        setActiveTab('ecommerce');
      }
    };

    syncRouteWithUrl();
    window.addEventListener('popstate', syncRouteWithUrl);
    return () => window.removeEventListener('popstate', syncRouteWithUrl);
  }, [currentUser]);

  // 2. Sync URL path when activeTab changes
  useEffect(() => {
    if (!currentUser) return;
    
    const path = window.location.pathname;
    const tabMap = {
      'ecommerce': 'store',
      'cart': 'cart',
      'my-orders': 'my-orders',
      'settings': 'settings',
      'admin': 'admin',
      'ai-assistant': 'ai-assistant'
    };
    
    const expectedSubPath = tabMap[activeTab] || 'store';
    const expectedPath = `/app/${expectedSubPath}`;
    
    if (path !== expectedPath) {
      window.history.pushState(null, '', expectedPath);
    }
  }, [activeTab, currentUser]);
  const [adminSubTab, setAdminSubTab] = useState('dashboard') // 'dashboard' | 'orders' | 'batches' | 'catalog' | 'simulations' | 'alerts' | 'analytics'
  const [hoveredDailyPoint, setHoveredDailyPoint] = useState(null) // { x, y, day, revenue, orders }
  const [hoveredMonthlyBar, setHoveredMonthlyBar] = useState(null) // { x, y, month, revenue, orders }
  const [toast, setToast] = useState(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  // Data States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [batches, setBatches] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [orders, setOrders] = useState([])
  const [subscriptionsList, setSubscriptionsList] = useState([])
  const [selectedPrices, setSelectedPrices] = useState({}) // product_id -> selected price index
  
  // AI Assistant States
  // AI Assistant States (Separated for Admin and Client)
  const [aiMessagesAdmin, setAiMessagesAdmin] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello Admin! I am your **Sharadha Stores Inventory Copilot**. I can help you check stock levels, view expiring batches, review ingredient stocks, or plan restocking. What inventory queries do you have today? 📋",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [aiMessagesClient, setAiMessagesClient] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your **Sharadha Stores Shopping Assistant**. I can help you check product prices, suggest serving recipes, browse categories, or track your order status. What are you looking to buy today? 🛍️",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [aiInputAdmin, setAiInputAdmin] = useState('')
  const [aiInputClient, setAiInputClient] = useState('')
  const [isAiTypingAdmin, setIsAiTypingAdmin] = useState(false)
  const [isAiTypingClient, setIsAiTypingClient] = useState(false)

  // 1. Admin AI Assistant Handler (Operational Inventory queries)
  const handleSendAdminAIMessage = (e, customText = null) => {
    if (e) e.preventDefault();
    const text = (customText || aiInputAdmin).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiMessagesAdmin(prev => [...prev, userMsg]);
    setAiInputAdmin('');
    setIsAiTypingAdmin(true);

    setTimeout(() => {
      let reply = "";
      const lower = text.toLowerCase();

      // Stock Check
      if (lower.includes('stock') || lower.includes('qty') || lower.includes('quantity') || lower.includes('threshold') || lower.includes('safety') || lower.includes('level') || lower.includes('low')) {
        if (lower.includes('ingredient') || lower.includes('raw') || lower.includes('material')) {
          // Ingredients stock check
          const lowIngs = ingredients.filter(i => i.stock_quantity < 15);
          if (lowIngs.length === 0) {
            reply = "✅ **Raw Material Status**: All ingredients are well stocked (15+ kg in inventory).";
          } else {
            reply = "⚠️ **Raw Material Shortage Alert**: The following ingredients have fallen below 15 kg safety limits:\n\n" +
              lowIngs.map(i => `• **${i.name}**: ${i.stock_quantity} ${i.unit} remaining (Threshold: 15 kg)`).join('\n') +
              "\n\n_Recommendation: Please contact suppliers to reorder these raw materials._";
          }
        } else {
          // Products stock check
          const lowStock = products.filter(p => {
            const matchingBatches = batches.filter(b => b.product_id === p.product_id && (b.status === 'Active' || b.status === 'Near Expiry'));
            const totalStock = matchingBatches.reduce((sum, b) => sum + b.current_stock, 0);
            return totalStock < 5;
          });
          
          if (lowStock.length === 0) {
            reply = "✅ **Inventory Status**: All products currently have safe stock levels (5+ units across active batches).";
          } else {
            reply = "⚠️ **Product Low Stock Alert**: The following products are low (under 5 units total):\n\n" + 
              lowStock.map(p => {
                const matchingBatches = batches.filter(b => b.product_id === p.product_id && (b.status === 'Active' || b.status === 'Near Expiry'));
                const totalStock = matchingBatches.reduce((sum, b) => sum + b.current_stock, 0);
                return `• **${p.name}**: ${totalStock} units remaining (Safety limit: 5).`;
              }).join('\n') + 
              "\n\n_Recommendation: Please schedule new production runs for these items in the Admin panel._";
          }
        }
      }
      // Expiry Check
      else if (lower.includes('expir') || lower.includes('spoil') || lower.includes('waste') || lower.includes('fresh')) {
        const nearExpiry = batches.filter(b => b.status === 'Near Expiry' && b.current_stock > 0);
        const expired = batches.filter(b => b.status === 'Expired' && b.current_stock > 0);

        let nearStr = nearExpiry.length > 0 
          ? nearExpiry.map(b => `• **${b.batch_code}** (${b.product_name}): Expires ${b.expiry_date} (${b.current_stock} units left)`).join('\n')
          : "• None";

        let expStr = expired.length > 0 
          ? expired.map(b => `• **${b.batch_code}** (${b.product_name}): Expired ${b.expiry_date} (${b.current_stock} units left)`).join('\n')
          : "• None";

        reply = `📅 **Batch Expiry & Spoilage Report (Internal)**:\n\n` +
          `🔴 **Expired Batches (Needs Discard)**:\n${expStr}\n\n` +
          `⚠️ **Near Expiry Batches (Sell soon)**:\n${nearStr}\n\n` +
          `_Operational action: Discard expired batches immediately. Run flash promotions or combo offers for Near Expiry batches to liquidate stock._`;
      }
      // Restock suggestions
      else if (lower.includes('restock') || lower.includes('reorder') || lower.includes('suggest') || lower.includes('plan') || lower.includes('produce')) {
        const lowStock = products.filter(p => {
          const matchingBatches = batches.filter(b => b.product_id === p.product_id && (b.status === 'Active' || b.status === 'Near Expiry'));
          const totalStock = matchingBatches.reduce((sum, b) => sum + b.current_stock, 0);
          return totalStock < 5;
        });

        if (lowStock.length === 0) {
          reply = "👍 **Restock Plan**: No urgent production batches needed. All product stock levels are stable.";
        } else {
          reply = "📋 **Recommended Production Plan**:\nBased on low stock safety limits (under 5 units), we suggest producing these batches:\n\n" +
            lowStock.map(p => {
              const matchingBatches = batches.filter(b => b.product_id === p.product_id && (b.status === 'Active' || b.status === 'Near Expiry'));
              const totalStock = matchingBatches.reduce((sum, b) => sum + b.current_stock, 0);
              const suggestQty = 20 - totalStock;
              return `• **${p.name}**: Produce a batch of **${suggestQty} units** (current stock is ${totalStock}).`;
            }).join('\n') +
            "\n\n_Note: Verify raw ingredient levels before scheduling the production run._";
        }
      }
      // Ingredients check
      else if (lower.includes('ingredient') || lower.includes('raw') || lower.includes('material')) {
        const lowIngs = ingredients.filter(i => i.stock_quantity < 15);
        let ingStr = ingredients.map(i => `• **${i.name}**: ${i.stock_quantity} ${i.unit} ${i.stock_quantity < 15 ? '⚠️ (Low)' : '✅'}`).join('\n');
        
        reply = `🥣 **Raw Ingredients Stock Summary**:\n\n${ingStr}\n\n` +
          (lowIngs.length > 0 
            ? `⚠️ Low raw ingredients: ${lowIngs.map(i => i.name).join(', ')}. Please replenish soon.` 
            : `✅ All raw ingredients are at safe stock levels.`);
      }
      // Greetings
      else if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey') || lower.includes('how are you')) {
        reply = "Hello Admin! 👋 Inventory Copilot is ready. Ask me about product low stock reports, batch expiry dates, reordering ingredients, or suggested production plans.";
      }
      // Default Fallback
      else {
        // Check if named product
        const matchedProduct = products.find(p => lower.includes(p.name.toLowerCase()));
        if (matchedProduct) {
          const matchingBatches = batches.filter(b => b.product_id === matchedProduct.product_id && b.current_stock > 0);
          const totalStock = matchingBatches.reduce((sum, b) => sum + b.current_stock, 0);
          
          let batchStr = matchingBatches.length > 0
            ? matchingBatches.map(b => `  - **${b.batch_code}**: ${b.current_stock} units (${b.status}, Exp: ${b.expiry_date})`).join('\n')
            : "  - No active batches in stock.";
            
          reply = `ℹ️ **Internal Status for ${matchedProduct.name}**:\n\n` +
            `• **Product ID**: ${matchedProduct.product_id}\n` +
            `• **Category**: ${matchedProduct.category_name}\n` +
            `• **Total Stock**: ${totalStock} units available.\n` +
            `• **Active Batches Details**:\n${batchStr}\n\n` +
            `To check ingredient ratios, look at the Recipes tab in the Admin panel!`;
        } else {
          reply = "🤖 **Admin Inventory Copilot**:\nI couldn't resolve that query. You can ask me about:\n\n" +
            "1. **Low Stock**: _'Check low stock'_ or _'Which products are low?'_\n" +
            "2. **Expiries**: _'Check expiring batches'_\n" +
            "3. **Ingredients**: _'Check raw ingredient stock levels'_\n" +
            "4. **Restocking**: _'Suggest restock quantities'_\n\n" +
            "Or name a product to query its detailed batch codes and stock statuses!";
        }
      }

      setAiMessagesAdmin(prev => [...prev, {
        id: Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAiTypingAdmin(false);
    }, 1200);
  };

  // 2. Client/Customer AI Assistant Handler (Shopping / Order queries)
  const handleSendClientAIMessage = (e, customText = null) => {
    if (e) e.preventDefault();
    const text = (customText || aiInputClient).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiMessagesClient(prev => [...prev, userMsg]);
    setAiInputClient('');
    setIsAiTypingClient(true);

    setTimeout(() => {
      let reply = "";
      const lower = text.toLowerCase();

      // Product Recipes / serving
      if (lower.includes('recipe') || lower.includes('pair') || lower.includes('cook') || lower.includes('eat') || lower.includes('serve') || lower.includes('use') || lower.includes('make') || lower.includes('prepare') || lower.includes('dish')) {
        const matchedProduct = products.find(p => lower.includes(p.name.toLowerCase()));
        if (matchedProduct) {
          const recipeInfo = {
            'Avakaya Mango Pickle': "🌶️ **Avakaya Mango Pickle serving suggestions**:\n- Pair it with steaming hot white rice, a generous dollop of pure ghee, and a side of roasted papad.\n- Serve it as a spicy condiment alongside curd rice (this is the absolute best combination!).\n- Mix it into potato salad for a tangy, Indian-inspired twist.",
            'Garlic Pickle': "🧄 **Garlic Pickle serving suggestions**:\n- Serve with warm parathas, puris, or rotis.\n- Elevate simple dal-chawal (lentils and rice) with a spoonful of this rich, pungent pickle.\n- Spread a tiny amount inside a cheese sandwich before grilling for a savory garlic kick.",
            'Ghee Mysore Pak': "🍬 **Ghee Mysore Pak dessert guide**:\n- Serve at room temperature at the end of festive meals.\n- Pair with a cup of hot South Indian filter coffee to balance the rich sweetness.\n- Slightly warm it up (3-5 seconds in a microwave) to make it melt-in-your-mouth soft.",
            'Rava Laddu': "🧁 **Rava Laddu serving suggestions**:\n- Serve as an afternoon tea-time snack with chai.\n- Present as a quick dessert during family gatherings and celebrations.\n- Best enjoyed within 10 days of production for optimal texture.",
            'Instant Idli Mix': "🥞 **Instant Idli Mix cooking guide**:\n1. Mix 1 cup of Idli Mix with 1 cup of sour curd/yogurt and 1/2 cup of water.\n2. Let the batter rest for 10-15 minutes.\n3. Pour into idli moulds and steam for 10-12 minutes on medium heat.\n4. Serve hot with coconut chutney and sambar!"
          };
          reply = recipeInfo[matchedProduct.name] || `🍽️ **${matchedProduct.name} Serving suggestion**:\nEnjoy this homemade delicacy as a side dish or snack. For sweet items, serve as desserts at celebrations. For pickles, pair with rice, rotis, or breakfast items like idli/dosa!`;
        } else {
          reply = "🍛 **Culinary & Serving Suggestions**:\nTo get custom suggestions, please specify the product name in your question! For example:\n- _'Suggest a recipe using Avakaya Mango Pickle'_\n- _'How to cook Instant Idli Mix?'_";
        }
      }
      // Pricing
      else if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('rs.') || lower.includes('rupee') || lower.includes('how much') || lower.includes('pricing')) {
        const matchedProduct = products.find(p => lower.includes(p.name.toLowerCase()));
        if (matchedProduct) {
          const pricesStr = matchedProduct.prices && matchedProduct.prices.length > 0
            ? matchedProduct.prices.map(pr => `• **${pr.quantity_description || pr.pack_size || 'Pack'}**: Rs. ${pr.price}`).join('\n')
            : "No pricing information available.";
          reply = `💰 **Pricing details for ${matchedProduct.name}**:\n\n${pricesStr}`;
        } else {
          reply = "💵 **Product Price List**:\nHere is a quick summary of our premium products:\n" + 
            products.map(p => `• **${p.name}** starting from Rs. ${p.prices && p.prices.length > 0 ? p.prices[0].price : 'N/A'}`).join('\n');
        }
      }
      // Order Status Tracking
      else if (lower.includes('order') || lower.includes('track') || lower.includes('status') || lower.includes('bought') || lower.includes('purchased')) {
        const myOrders = orders.filter(o => String(o.customer_email) === String(currentUser?.email));
        if (myOrders.length === 0) {
          reply = "📦 **Order Status**: You haven't placed any orders yet. Head over to our store to make your first purchase! 🛒";
        } else {
          reply = "📦 **Your Orders Status**:\nHere are details of your recent purchases:\n\n" +
            myOrders.map(o => `• **Order #${o.order_id}** (${o.order_date}): Total Rs. ${o.total_amount} - Status: **${o.status === 'Paid' ? 'Delivered' : 'Pending COD'}**`).join('\n') +
            "\n\n_To view itemized details, click the Order History button in the navigation header._";
        }
      }
      // Greetings
      else if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey') || lower.includes('how are you')) {
        reply = "Hello! 👋 I am your Shopping Assistant. Ask me about product prices, recipes serving suggestions, or how to track your recent orders!";
      }
      // Default Fallback
      else {
        const matchedProduct = products.find(p => lower.includes(p.name.toLowerCase()));
        if (matchedProduct) {
          reply = `ℹ️ **Details on ${matchedProduct.name}**:\n\n` +
            `• **Category**: ${matchedProduct.category_name || 'Homemade Food'}\n` +
            `• **Description**: ${matchedProduct.description || 'Premium homemade quality.'}\n` +
            `• **Availability**: In Stock & Ready to ship!\n\n` +
            `Would you like to see pricing or recipes for this item? Just ask!`;
        } else {
          reply = "🤖 **Shopping Assistant**:\nI couldn't quite match that. You can ask me about:\n\n" +
            "1. **Pricing**: _'Price of Garlic Pickle'_ or _'Show product price list'_\n" +
            "2. **Recipes & Serving**: _'Suggest a recipe using Avakaya Mango Pickle'_\n" +
            "3. **Order Status**: _'Track my orders'_\n\n" +
            "Or type a product name to see if it is available in our store!";
        }
      }

      setAiMessagesClient(prev => [...prev, {
        id: Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAiTypingClient(false);
    }, 1200);
  };

    // Auto-scroll AI chat to bottom when messages update or assistant starts typing
  useEffect(() => {
    const threadIds = [
      'ai-chat-thread-admin',
      'ai-chat-thread-client',
      'ai-chat-thread-widget-admin',
      'ai-chat-thread-widget-client'
    ];
    threadIds.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [aiMessagesAdmin, aiMessagesClient, isAiTypingAdmin, isAiTypingClient, activeTab, currentUser, isChatOpen]);

  // New Product Modal States
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [newProductDesc, setNewProductDesc] = useState('')
  const [newProductShelfLife, setNewProductShelfLife] = useState('')
  const [newProductImg, setNewProductImg] = useState('')
  const [newProductPrices, setNewProductPrices] = useState([{ quantity_description: '250g Pack', price: '' }])
  const [newProductRecipe, setNewProductRecipe] = useState('')
  const [newProductIngredients, setNewProductIngredients] = useState({})
  const [newProductIngSearch, setNewProductIngSearch] = useState('')
  
  // Edit Product Modal States
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState(null)
  const [editProductName, setEditProductName] = useState('')
  const [editProductCategoryName, setEditProductCategoryName] = useState('')
  const [editProductDesc, setEditProductDesc] = useState('')
  const [editProductShelfLife, setEditProductShelfLife] = useState('')
  const [editProductImg, setEditProductImg] = useState('')
  const [editProductPrices, setEditProductPrices] = useState([])
  const [editProductRecipe, setEditProductRecipe] = useState('')
  const [editProductIngredients, setEditProductIngredients] = useState({})
  const [editProductIngSearch, setEditProductIngSearch] = useState('')
  
  // New Ingredient Modal States
  const [isCreateIngredientModalOpen, setIsCreateIngredientModalOpen] = useState(false)
  const [newIngredientName, setNewIngredientName] = useState('')
  const [newIngredientStock, setNewIngredientStock] = useState('')
  const [newIngredientUnit, setNewIngredientUnit] = useState('kg')
  
  // Edit Ingredient Modal States
  const [isEditIngredientModalOpen, setIsEditIngredientModalOpen] = useState(false)
  const [editIngredientId, setEditIngredientId] = useState(null)
  const [editIngredientName, setEditIngredientName] = useState('')
  const [editIngredientStock, setEditIngredientStock] = useState('')
  const [editIngredientUnit, setEditIngredientUnit] = useState('kg')
  const [editIngredientIsReferenced, setEditIngredientIsReferenced] = useState(false)
  const [batchesSearchQuery, setBatchesSearchQuery] = useState('') // For searching admin batches table
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [changePasswordCurrent, setChangePasswordCurrent] = useState('')
  const [changePasswordNew, setChangePasswordNew] = useState('')
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // Shopping Cart States
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutStatus, setCheckoutStatus] = useState(null)
  
  // Customer Modals
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState(null)
  const [orderProduct, setOrderProduct] = useState(null)
  const [orderActivePrice, setOrderActivePrice] = useState(null)
  const [subscriptionProduct, setSubscriptionProduct] = useState(null)
  
  // Admin Detail Drawer
  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState(null)
  const [refillIngredient, setRefillIngredient] = useState(null)
  const [refillQty, setRefillQty] = useState('')
  
  // Catalog Filtering
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogDeleteSearchQuery, setCatalogDeleteSearchQuery] = useState('')
  const [categoryDeleteSearchQuery, setCategoryDeleteSearchQuery] = useState('')
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Cart delivery address states
  const [cartAddressFlat, setCartAddressFlat] = useState('')
  const [cartAddressArea, setCartAddressArea] = useState('')
  const [cartAddressPincode, setCartAddressPincode] = useState('')
  const [cartAddressCity, setCartAddressCity] = useState('')
  const [cartAddressState, setCartAddressState] = useState('')
  const [selectedCartAddressId, setSelectedCartAddressId] = useState('new')
  const [saveCartAddressToBook, setSaveCartAddressToBook] = useState(false)
  
  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [upiPaymentModalDetails, setUpiPaymentModalDetails] = useState(null)
  const [isPaymentReceived, setIsPaymentReceived] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [codSuccessDetails, setCodSuccessDetails] = useState(null)




  
  // New Batch Form States
  const [formProductId, setFormProductId] = useState('')
  const [formPriceId, setFormPriceId] = useState('')
  const [formProductPrices, setFormProductPrices] = useState([])
  const [formBatchCode, setFormBatchCode] = useState('')
  const [formQuantityMade, setFormQuantityMade] = useState('')
  const [formMfgDate, setFormMfgDate] = useState(new Date().toISOString().split('T')[0])
  const [formShelfLife, setFormShelfLife] = useState('')
  const [formIngredientsNeeded, setFormIngredientsNeeded] = useState([])
  const [formErrors, setFormErrors] = useState({})

  // Date presentation helper YYYY-MM-DD -> DD-MM-YY
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A'
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parts[0].substring(2)
      const month = parts[1]
      const day = parts[2]
      return `${day}-${month}-${year}`
    }
    return dateStr
  }

  // Fetch all initial data
  const fetchData = async () => {
    try {
      // Products
      const prodRes = await fetch('/api/products')
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData)
      }

      // Categories
      const catRes = await fetch('/api/categories')
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData)
      }

      // Ingredients
      const ingRes = await fetch('/api/ingredients')
      if (ingRes.ok) {
        const ingData = await ingRes.json()
        setIngredients(ingData)
      }

      // Batches
      const batchRes = await fetch('/api/batches/list')
      if (batchRes.ok) {
        const batchData = await batchRes.json()
        setBatches(batchData)
      }

      // Summary
      const summaryRes = await fetch('/api/dashboard/summary')
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setDashboardSummary(summaryData)
      }

      // Suggestions
      const suggRes = await fetch('/api/suggestions')
      if (suggRes.ok) {
        const suggData = await suggRes.json()
        setSuggestions(suggData)
      }

      // Notifications
      const notifRes = await fetch('/api/notifications')
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setNotifications(notifData)
      }

      // Customer Orders
      const orderRes = await fetch('/api/orders')
      if (orderRes.ok) {
        const orderData = await orderRes.json()
        setOrders(orderData)
      }

      // Subscriptions
      const subRes = await fetch('/api/subscriptions')
      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscriptionsList(subData)
      }
    } catch (error) {
      showToast('Error fetching database records.', 'danger')
    }
  }

  // Slideshow Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    {
      image: '/mango_pickle.png',
      title: 'Authentic Andhra Avakaya',
      subtitle: 'Handcrafted raw mango pickle infused with traditional spices and pure sesame oil.'
    },
    {
      image: '/mysore_pak.png',
      title: 'Traditional Ghee Mysore Pak',
      subtitle: 'Rich, aromatic, and melt-in-mouth sweet made with pure ghee and chickpea flour.'
    },
    {
      image: '/spice_powders.png',
      title: 'Aromatic Hand-Ground Spices',
      subtitle: 'Freshly ground sambar powder and garam masala prepared from selected spice beans.'
    }
  ]

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (currentUser && addressBook.length > 0) {
      const defaultAddr = addressBook.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedCartAddressId(String(defaultAddr.id));
        setCartAddressFlat(defaultAddr.flat);
        setCartAddressArea(defaultAddr.area);
        setCartAddressPincode(defaultAddr.pincode);
        setCartAddressCity(defaultAddr.city);
        setCartAddressState(defaultAddr.state);
      } else {
        setSelectedCartAddressId(String(addressBook[0].id));
        setCartAddressFlat(addressBook[0].flat);
        setCartAddressArea(addressBook[0].area);
        setCartAddressPincode(addressBook[0].pincode);
        setCartAddressCity(addressBook[0].city);
        setCartAddressState(addressBook[0].state);
      }
    } else {
      setSelectedCartAddressId('new');
      setCartAddressFlat('');
      setCartAddressArea('');
      setCartAddressPincode('');
      setCartAddressCity('');
      setCartAddressState('');
    }
    setSaveCartAddressToBook(false);
  }, [currentUser, addressBook])

  useEffect(() => {
    if (activeTab !== 'ecommerce') return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeTab, slides.length])

  useEffect(() => {
  // Replaced polling mechanism with simulated QR click

  }, [upiPaymentModalDetails])

  // Toast notifications helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ---------------- E-COMMERCE LOGIC ----------------

  const handleAddToCart = (product, priceRecord) => {
    const existingIndex = cart.findIndex(
      (item) => item.product_id === product.product_id && item.price_id === priceRecord.price_id
    )

    if (existingIndex > -1) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([
        ...cart,
        {
          product_id: product.product_id,
          name: product.name,
          image_url: product.image_url,
          price_id: priceRecord.price_id,
          qty_desc: priceRecord.quantity_description,
          price: priceRecord.price,
          quantity: 1,
        },
      ])
    }
    showToast(`Added ${product.name} (${priceRecord.quantity_description}) to cart.`)
  }

  const updateCartQuantity = (index, delta) => {
    const newCart = [...cart]
    newCart[index].quantity += delta
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1)
    }
    setCart(newCart)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) return
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data))
        setCurrentUser(data)
        setLoginUsername('')
        setLoginPassword('')
        showToast(`Welcome back, ${data.name}!`, 'success')
        // Set starting active tab based on role
        if (data.role === 'admin') {
          setActiveTab('admin')
        } else {
          setActiveTab('ecommerce')
        }
      } else {
        showToast(data.error || 'Invalid username or password.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during login.', 'danger')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword || !registerPhone || !registerAddress) {
      showToast('All fields are required.', 'danger')
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      showToast('Passwords do not match.', 'danger')
      return
    }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          phone: registerPhone,
          address: registerAddress
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast(data.message || 'Registration successful! Please log in.', 'success')
        setIsRegisterMode(false)
        setLoginUsername(registerEmail)
        setLoginPassword('')
        setRegisterName('')
        setRegisterEmail('')
        setRegisterPassword('')
        setRegisterConfirmPassword('')
        setShowRegisterPassword(false)
        setShowRegisterConfirmPassword(false)
        setRegisterPhone('')
        setRegisterAddress('')
      } else {
        showToast(data.error || 'Registration failed.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during registration.', 'danger')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setCart([])
    showToast('Signed out successfully.')
  }

  const handleOpenSettings = () => {
    if (!currentUser) return
    const fullName = currentUser.name || ''
    const parts = fullName.trim().split(/\s+/)
    const first = parts[0] || ''
    const last = parts.slice(1).join(' ') || ''
    
    setSettingsFirstName(first)
    setSettingsLastName(last)
    setSettingsPhone(currentUser.phone || '')
    setSettingsEmail(currentUser.email || '')
    
    setIsSettingsEditMode(false)
    setActiveTab('settings')
  }

  const handleSaveSettings = async () => {
    if (!settingsFirstName.trim() || !settingsEmail.trim() || !settingsPhone.trim()) {
      showToast('Name, Email, and Phone Number are required.', 'danger')
      return
    }
    const combinedName = (settingsFirstName.trim() + " " + settingsLastName.trim()).trim()
    
    try {
      const res = await fetch('/api/customers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.customer_id,
          name: combinedName,
          email: settingsEmail.trim(),
          phone: settingsPhone.trim(),
          address: currentUser.address
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const updatedUser = {
          ...currentUser,
          name: data.customer.name,
          email: data.customer.email,
          phone: data.customer.phone,
          address: data.customer.address
        }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
        setIsSettingsEditMode(false)
        showToast('Profile updated successfully!', 'success')
      } else {
        showToast(data.error || 'Failed to update profile.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during profile update.', 'danger')
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!changePasswordCurrent || !changePasswordNew || !changePasswordConfirm) {
      showToast('All fields are required.', 'danger')
      return
    }
    if (changePasswordNew !== changePasswordConfirm) {
      showToast('New passwords do not match.', 'danger')
      return
    }
    if (changePasswordNew.length < 6) {
      showToast('New password must be at least 6 characters long.', 'danger')
      return
    }
    setIsUpdatingPassword(true)
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email || (currentUser.role === 'admin' ? 'admin@sharadhastores.com' : ''),
          role: currentUser.role,
          current_password: changePasswordCurrent,
          new_password: changePasswordNew
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setChangePasswordCurrent('')
        setChangePasswordNew('')
        setChangePasswordConfirm('')
        showToast(data.message || 'Password updated successfully!', 'success')
      } else {
        showToast(data.error || 'Failed to change password.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during password update.', 'danger')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCheckoutClick = () => {
    if (cart.length === 0) return
    const isLegacyDefault = selectedCartAddressId === 'default';
    if (
      !cartAddressFlat.trim() ||
      (!isLegacyDefault && (
        !cartAddressArea.trim() ||
        !cartAddressPincode.trim() ||
        !cartAddressCity.trim() ||
        !cartAddressState.trim()
      ))
    ) {
      showToast('All address fields are required for checkout.', 'danger')
      return
    }
    setShowPaymentModal(true)
  }

  const handleCheckout = async (chosenMethod) => {
    if (cart.length === 0) return
    const activeMethod = chosenMethod || 'COD';
    const isLegacyDefault = selectedCartAddressId === 'default';
    if (
      !cartAddressFlat.trim() ||
      (!isLegacyDefault && (
        !cartAddressArea.trim() ||
        !cartAddressPincode.trim() ||
        !cartAddressCity.trim() ||
        !cartAddressState.trim()
      ))
    ) {
      showToast('All address fields are required for checkout.', 'danger')
      return
    }
    
    const combinedAddress = [
      cartAddressFlat.trim(),
      cartAddressArea.trim(),
      cartAddressPincode.trim(),
      cartAddressCity.trim(),
      cartAddressState.trim()
    ].filter(part => part && part.trim()).join('\n')
    
    setCheckoutStatus('processing')
    
    // Auto-save new address to Address Book if customer checked the box
    if (currentUser && selectedCartAddressId === 'new' && saveCartAddressToBook) {
      const newAddr = {
        id: Date.now(),
        flat: cartAddressFlat.trim(),
        area: cartAddressArea.trim(),
        pincode: cartAddressPincode.trim(),
        city: cartAddressCity.trim(),
        state: cartAddressState.trim(),
        isDefault: addressBook.length === 0
      }
      const newBook = [...addressBook, newAddr]
      saveAddressBook(newBook)
    }
    
    setPaymentMethod(activeMethod);
    
    try {
      if (activeMethod === 'Razorpay') {
        const response = await fetch('/api/orders/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: currentUser ? currentUser.customer_id : 1,
            message: combinedAddress,
            items: cart.map((item) => ({
              product_id: item.product_id,
              price_id: item.price_id,
              quantity: item.quantity,
            })),
            payment_method: 'Razorpay',
          }),
        });
        
        const result = await response.json();
        if (response.ok) {
          const options = {
            key: result.razorpay_key_id,
            amount: result.total_amount * 100,
            currency: 'INR',
            name: 'Sharadha Stores',
            description: 'Order Payment',
            order_id: result.razorpay_order_id,
            handler: async function (paymentResponse) {
              try {
                const verifyResponse = await fetch('/api/razorpay/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    order_id: result.order_id
                  }),
                });
                const verifyResult = await verifyResponse.json();
                if (verifyResponse.ok) {
                  setUpiPaymentModalDetails({ order_id: result.order_id });
                  setIsPaymentReceived(true);
                  setCart([]);
                  showToast('Payment received! Order placed successfully.', 'success');
                  fetchData();
                  setTimeout(() => {
                    setIsPaymentReceived(false);
                    setUpiPaymentModalDetails(null);
                    setActiveTab('ecommerce');
                    setCheckoutStatus(null);
                  }, 3000);
                } else {
                  showToast(verifyResult.error || 'Payment verification failed.', 'danger');
                  setCheckoutStatus(null);
                }
              } catch (err) {
                showToast('Error verifying payment.', 'danger');
                setCheckoutStatus(null);
              }
            },
            prefill: {
              name: currentUser ? currentUser.name : '',
              email: currentUser ? currentUser.email : '',
              contact: currentUser ? currentUser.phone : ''
            },
            theme: { color: '#2ecc71' }
          };
          if (!window.Razorpay) {
              showToast('Razorpay SDK failed to load. Are you offline?', 'danger');
              setCheckoutStatus(null);
              return;
          }
          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function (paymentResponse) {
            showToast('Payment failed or cancelled.', 'danger');
            setCheckoutStatus(null);
          });
          rzp1.open();
        } else {
          setCheckoutStatus('failed');
          showToast(result.error || 'Checkout failed.', 'danger');
          setTimeout(() => setCheckoutStatus(null), 3000);
        }
        return;
      }

      // Cash on Delivery
      const response = await fetch('/api/orders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser ? currentUser.customer_id : 1,
          message: combinedAddress,
          items: cart.map((item) => ({
            product_id: item.product_id,
            price_id: item.price_id,
            quantity: item.quantity,
          })),
          payment_method: 'COD',
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setCheckoutStatus('success')
        setCart([])
        setCodSuccessDetails({ order_id: result.order_id })
        showToast('Order placed successfully! Stocks updated via FEFO rules.', 'success')
        
        fetchData()
        setTimeout(() => {
          setCodSuccessDetails(null)
          setCheckoutStatus(null)
          setActiveTab('my-orders')
        }, 3000)
      } else {
        setCheckoutStatus('failed')
        showToast(result.error || 'Checkout failed due to insufficient stock.', 'danger')
        setTimeout(() => setCheckoutStatus(null), 3000)
      }
    } catch (err) {
      setCheckoutStatus('failed')
      showToast('Connection error during checkout.', 'danger')
      setTimeout(() => setCheckoutStatus(null), 3000)
    }
  }

  // Handle subscription signup
  const handleSubscriptionSubmit = async (frequency) => {
    if (!subscriptionProduct) return
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser ? currentUser.customer_id : 1,
          product_id: subscriptionProduct.product_id,
          frequency,
        }),
      })
      if (res.ok) {
        showToast(`Subscribed to ${subscriptionProduct.name} successfully!`, 'success')
        setSelectedCategory('All')
        setSubscriptionProduct(null)
        fetchData()
      }
    } catch (err) {
      showToast('Failed to create subscription.', 'danger')
    }
  }

  // Handle direct custom order
  const handleDirectOrderSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const name = formData.get('name')
    const contact = formData.get('contact')
    const quantity = parseInt(formData.get('quantity'))
    const message = formData.get('message')

    if (!name || !contact || quantity <= 0) {
      showToast('Please fill out all required fields.', 'danger')
      return
    }

    try {
      const res = await fetch('/api/orders/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser ? currentUser.customer_id : undefined,
          name,
          contact,
          message, // will be saved as delivery address
          items: [{
            product_id: orderProduct.product_id,
            price_id: orderActivePrice.price_id,
            quantity: quantity
          }],
          payment_method: 'COD'
        }),
      })
      const result = await res.json()
      if (res.ok) {
        showToast('Order placed successfully! Stocks updated.', 'success')
        setOrderProduct(null)
        setOrderActivePrice(null)
        fetchData()
      } else {
        showToast(result.error || 'Order placement failed.', 'danger')
      }
    } catch (err) {
      showToast('Order submission failed.', 'danger')
    }
  }

  // Handle order fulfillment
  const handleFulfillOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to fulfill order #${orderId}? This will deduct product stock from the batches catalog according to FEFO rules.`)) {
      return
    }
    try {
      const res = await fetch(`/api/orders/fulfill/${orderId}`, {
        method: 'POST'
      })
      const result = await res.json()
      if (res.ok) {
        showToast(`Order #${orderId} fulfilled successfully!`, 'success')
        fetchData()
      } else {
        showToast(result.error || 'Failed to fulfill order.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during order fulfillment.', 'danger')
    }
  }

  // Handle product creation submit
  const handleCreateProductSubmit = async (e) => {
    e.preventDefault()
    
    if (!newProductName || !newProductShelfLife || newProductPrices.some(p => !p.quantity_description || !p.price)) {
      showToast('Please fill out all required fields and pricing sizes.', 'danger')
      return
    }

    if (!customCategoryName.trim()) {
      showToast('Please write the product category.', 'danger')
      return
    }

    const payload = {
      category_name: customCategoryName.trim(),
      name: newProductName,
      description: newProductDesc,
      image_url: newProductImg,
      shelf_life_days: parseInt(newProductShelfLife),
      prices: newProductPrices.map(p => ({
        quantity_description: p.quantity_description,
        price: parseFloat(p.price)
      })),
      recipe: newProductRecipe,
      ingredients: Object.keys(newProductIngredients)
        .filter(ingId => ingredients.some(i => i.ingredient_id === parseInt(ingId)))
        .map(ingId => {
          const ingRecord = ingredients.find(i => i.ingredient_id === parseInt(ingId))
          const dbUnit = ingRecord ? ingRecord.unit : 'kg'
          const ratioObj = newProductIngredients[ingId]
          const quantityNeeded = ratioObj 
            ? convertToDbValue(ratioObj.value, ratioObj.unit, dbUnit)
            : 0
          return {
            ingredient_id: parseInt(ingId),
            quantity_needed: quantityNeeded
          }
        }).filter(ing => ing.quantity_needed > 0)
    }

    try {
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Product "${newProductName}" successfully created!`, 'success')
        
        // Reset states
        setNewProductName('')
        setCustomCategoryName('')
        setNewProductDesc('')
        setNewProductShelfLife('')
        setNewProductImg('')
        setNewProductPrices([{ quantity_description: '250g Pack', price: '' }])
        setNewProductRecipe('')
        setNewProductIngredients({})
        setNewProductIngSearch('')
        setIsCreateProductModalOpen(false)
        
        fetchData()
      } else {
        showToast(data.error || 'Failed to create product.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during product creation.', 'danger')
    }
  }

  // Open Product Edit modal and prepopulate it
  const openEditProductModal = (product) => {
    setEditProductId(product.product_id)
    setEditProductName(product.name)
    setEditProductCategoryName(product.category_name || '')
    setEditProductDesc(product.description || '')
    setEditProductShelfLife(product.shelf_life_days.toString())
    setEditProductImg(product.image_url || '')
    
    // Map prices
    const prices = product.prices ? product.prices.map(pr => ({
      price_id: pr.price_id,
      quantity_description: pr.quantity_description,
      price: pr.price.toString()
    })) : []
    setEditProductPrices(prices)
    
    // Map recipe (first instructions)
    const recipeText = product.recipes && product.recipes.length > 0 ? product.recipes[0].instructions : ''
    setEditProductRecipe(recipeText)
    
    // Map recipe ingredients ratios
    const matchedRatios = {}
    if (product.recipe_ingredients) {
      product.recipe_ingredients.forEach(ri => {
        const ingRecord = ingredients.find(ing => ing.ingredient_id === ri.ingredient_id)
        const dbUnit = ingRecord ? ingRecord.unit : 'kg'
        const frontendValObj = convertToFrontendValue(ri.ratio, dbUnit)
        matchedRatios[ri.ingredient_id] = {
          value: frontendValObj.value.toString(),
          unit: frontendValObj.unit
        }
      })
    }
    setEditProductIngredients(matchedRatios)
    setEditProductIngSearch('')
    
    setIsEditProductModalOpen(true)
  }

  // Handle product edit submit
  const handleEditProductSubmit = async (e) => {
    e.preventDefault()
    
    if (!editProductName || !editProductShelfLife || editProductPrices.some(p => !p.quantity_description || !p.price)) {
      showToast('Please fill out all required fields and pricing sizes.', 'danger')
      return
    }

    if (!editProductCategoryName.trim()) {
      showToast('Please write the product category.', 'danger')
      return
    }

    const payload = {
      category_name: editProductCategoryName.trim(),
      name: editProductName,
      description: editProductDesc,
      image_url: editProductImg,
      shelf_life_days: parseInt(editProductShelfLife),
      prices: editProductPrices.map(p => ({
        price_id: p.price_id || null,
        quantity_description: p.quantity_description,
        price: parseFloat(p.price)
      })),
      recipe: editProductRecipe,
      ingredients: Object.keys(editProductIngredients)
        .filter(ingId => ingredients.some(i => i.ingredient_id === parseInt(ingId)))
        .map(ingId => {
          const ingRecord = ingredients.find(i => i.ingredient_id === parseInt(ingId))
          const dbUnit = ingRecord ? ingRecord.unit : 'kg'
          const ratioObj = editProductIngredients[ingId]
          const quantityNeeded = ratioObj 
            ? (typeof ratioObj === 'object' ? convertToDbValue(ratioObj.value, ratioObj.unit, dbUnit) : parseFloat(ratioObj || 0))
            : 0
          return {
            ingredient_id: parseInt(ingId),
            quantity_needed: quantityNeeded
          }
        }).filter(ing => ing.quantity_needed > 0)
    }

    try {
      const res = await fetch(`/api/products/edit/${editProductId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Product "${editProductName}" successfully updated!`, 'success')
        setIsEditProductModalOpen(false)
        fetchData()
      } else {
        showToast(data.error || 'Failed to update product.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during product update.', 'danger')
    }
  }

  // Handle ingredient creation submit
  const handleCreateIngredientSubmit = async (e) => {
    e.preventDefault()
    
    if (!newIngredientName || newIngredientStock === '' || parseFloat(newIngredientStock) < 0 || !newIngredientUnit) {
      showToast('Please fill out all required fields.', 'danger')
      return
    }

    try {
      const res = await fetch('/api/ingredients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIngredientName,
          stock_quantity: parseFloat(newIngredientStock),
          unit: newIngredientUnit
        })
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Raw material "${newIngredientName}" successfully added!`, 'success')
        setNewIngredientName('')
        setNewIngredientStock('')
        setNewIngredientUnit('kg')
        setIsCreateIngredientModalOpen(false)
        fetchData()
      } else {
        showToast(data.error || 'Failed to add ingredient.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during ingredient addition.', 'danger')
    }
  }

  // Open Edit Ingredient modal and prepopulate it
  const openEditIngredientModal = (ing) => {
    setEditIngredientId(ing.ingredient_id)
    setEditIngredientName(ing.name)
    setEditIngredientStock(ing.stock_quantity.toString())
    setEditIngredientUnit(ing.unit)
    
    const isReferenced = products.some(p => 
      p.recipe_ingredients && p.recipe_ingredients.some(ri => ri.ingredient_id === ing.ingredient_id)
    )
    setEditIngredientIsReferenced(isReferenced)
    setIsEditIngredientModalOpen(true)
  }

  // Handle ingredient editing submit
  const handleEditIngredientSubmit = async (e) => {
    e.preventDefault()
    
    if (!editIngredientName || editIngredientStock === '' || parseFloat(editIngredientStock) < 0 || !editIngredientUnit) {
      showToast('Please fill out all required fields.', 'danger')
      return
    }

    try {
      const res = await fetch(`/api/ingredients/edit/${editIngredientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editIngredientName,
          stock_quantity: parseFloat(editIngredientStock),
          unit: editIngredientUnit
        })
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Raw material "${editIngredientName}" successfully updated!`, 'success')
        setIsEditIngredientModalOpen(false)
        fetchData()
      } else {
        showToast(data.error || 'Failed to update ingredient.', 'danger')
      }
    } catch (err) {
      showToast('Connection error during ingredient update.', 'danger')
    }
  }

  // ---------------- ADMIN LOGIC ----------------

  // Handle product selection in Batch Form
  const handleFormProductChange = (prodId) => {
    setFormProductId(prodId)
    if (!prodId) {
      setFormBatchCode('')
      setFormShelfLife('')
      setFormIngredientsNeeded([])
      setFormProductPrices([])
      setFormPriceId('')
      return
    }

    const prod = products.find((p) => p.product_id === parseInt(prodId))
    if (prod) {
      // 1. Prepopulate default shelf life
      setFormShelfLife(prod.shelf_life_days)
      
      // 2. Prepopulate recipe ingredient list dynamically from database
      const matchedIngs = prod.recipe_ingredients || []
      setFormIngredientsNeeded(matchedIngs.map(ing => ({
        ...ing,
        quantity_used: 0
      })))

      // 3. Auto-generate batch No as sequential number (1, 2, 3...)
      let maxNum = 0
      batches.forEach(b => {
        const num = parseInt(b.batch_code)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      })
      setFormBatchCode((maxNum + 1).toString())

      // 4. Prepopulate pack sizes and select the first one
      const matchedPrices = prod.prices || []
      setFormProductPrices(matchedPrices)
      if (matchedPrices.length > 0) {
        setFormPriceId(matchedPrices[0].price_id.toString())
      } else {
        setFormPriceId('')
      }
    }
  }

  // Update calculated ingredient requirements when quantity made is edited
  const handleQuantityMadeChange = (qty) => {
    setFormQuantityMade(qty)
    const val = parseFloat(qty) || 0
    
    setFormIngredientsNeeded(prev => 
      prev.map(ing => ({
        ...ing,
        quantity_used: (val * ing.ratio).toFixed(2)
      }))
    )
  }

  // Handle batch form submit
  const handleCreateBatchSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const errors = {}
    if (!formProductId) errors.productId = 'Product is required'
    if (!formPriceId) errors.priceId = 'Pack size is required'
    if (!formBatchCode) errors.batchCode = 'Batch No is required'
    if (!formQuantityMade || parseInt(formQuantityMade) <= 0) errors.qty = 'Must be greater than 0'
    if (!formShelfLife || parseInt(formShelfLife) <= 0) errors.shelfLife = 'Must be greater than 0'
    
    // Check ingredient stock limits
    formIngredientsNeeded.forEach((ing) => {
      const dbIng = ingredients.find(i => i.ingredient_id === ing.ingredient_id)
      if (dbIng && dbIng.stock_quantity < parseFloat(ing.quantity_used)) {
        errors.ingredients = `Insufficient stock for ${ing.name}. Available: ${dbIng.stock_quantity} ${dbIng.unit}.`
      }
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToast('Validation failed. Check form errors.', 'danger')
      return
    }

    setFormErrors({})
    try {
      const res = await fetch('/api/batches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formProductId),
          price_id: parseInt(formPriceId),
          batch_code: formBatchCode,
          quantity_made: parseInt(formQuantityMade),
          manufacturing_date: formMfgDate,
          shelf_life_days: parseInt(formShelfLife),
          ingredients: formIngredientsNeeded.map(ing => ({
            ingredient_id: ing.ingredient_id,
            quantity_used: parseFloat(ing.quantity_used)
          }))
        }),
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Batch ${formBatchCode} successfully created!`, 'success')
        
        // Reset form
        setFormProductId('')
        setFormPriceId('')
        setFormProductPrices([])
        setFormBatchCode('')
        setFormQuantityMade('')
        setFormShelfLife('')
        setFormIngredientsNeeded([])
        
        fetchData()
      } else {
        showToast(data.error || 'Failed to create batch.', 'danger')
      }
    } catch (err) {
      showToast('Failed to connect to backend API.', 'danger')
    }
  }

  // Refill raw materials
  const handleRefillSubmit = async (e) => {
    e.preventDefault()
    if (!refillIngredient || !refillQty || parseFloat(refillQty) <= 0) return
    
    try {
      const res = await fetch('/api/ingredients/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient_id: refillIngredient.ingredient_id,
          quantity: parseFloat(refillQty)
        }),
      })
      if (res.ok) {
        showToast(`Added ${refillQty} ${refillIngredient.unit} to ${refillIngredient.name}.`)
        setRefillIngredient(null)
        setRefillQty('')
        fetchData()
      }
    } catch (err) {
      showToast('Refill request failed.', 'danger')
    }
  }

  // Open specific batch action logs and orders consumption details
  const openBatchDetails = async (batchId) => {
    try {
      const res = await fetch(`/api/batches/detail/${batchId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBatchForDetail(data)
      }
    } catch (err) {
      showToast('Failed to retrieve batch detail logs.', 'danger')
    }
  }

  // Delete specific batch entry and all its dependency history/deductions
  const handleDeleteBatch = async (batchId, batchCode) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchCode}"? This will transactionally clear its action logs and order deductions.`)) {
      return
    }
    try {
      const res = await fetch(`/api/batches/delete/${batchId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Batch ${batchCode} deleted successfully.`, 'success')
        fetchData()
      } else {
        showToast(data.error || 'Failed to delete batch.', 'danger')
      }
    } catch (err) {
      showToast('Failed to delete batch.', 'danger')
    }
  }

  // Delete specific product and cascadingly clean up all references/history/orders
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`WARNING: Are you sure you want to delete product "${productName}"? This will transactionally delete all associated batches, order items, history logs, recipes, prices, and subscriptions. This action cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/products/delete/${productId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Product "${productName}" deleted successfully.`, 'success')
        if (parseInt(formProductId) === parseInt(productId)) {
          setFormProductId('')
          setFormPriceId('')
          setFormProductPrices([])
          setFormBatchCode('')
          setFormQuantityMade('')
          setFormShelfLife('')
          setFormIngredientsNeeded([])
        }
        fetchData()
      } else {
        showToast(data.error || 'Failed to delete product.', 'danger')
      }
    } catch (err) {
      showToast('Failed to delete product.', 'danger')
    }
  }

  // Delete specific raw material
  const handleDeleteIngredient = async (ingredientId, ingredientName) => {
    if (!window.confirm(`Are you sure you want to delete raw material "${ingredientName}"? This action cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/ingredients/delete/${ingredientId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Raw material "${ingredientName}" deleted successfully.`, 'success')
        fetchData()
      } else {
        showToast(data.error || 'Failed to delete raw material.', 'danger')
      }
    } catch (err) {
      showToast('Failed to delete raw material.', 'danger')
    }
  }

  // Delete specific category
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"? This action cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/categories/delete/${categoryId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Category "${categoryName}" deleted successfully.`, 'success')
        fetchData()
      } else {
        showToast(data.error || 'Failed to delete category.', 'danger')
      }
    } catch (err) {
      showToast('Failed to delete category.', 'danger')
    }
  }

  // Delete specific customer order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)) {
      return
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Order #${orderId} deleted successfully.`, 'success')
        fetchData()
      } else {
        showToast(data.error || 'Failed to delete order.', 'danger')
      }
    } catch (err) {
      showToast('Failed to delete order.', 'danger')
    }
  }

  // ---------------- REPORT EXPORT & PRINT LOGIC ----------------

  // Export current inventory spreadsheet CSV
  const exportInventoryCSV = () => {
    if (products.length === 0) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Product ID,Product Name,Category,Total Stock (Units),Safety Threshold\n'
    
    products.forEach((p) => {
      csvContent += `${p.product_id},"${p.name}","${p.category_name}",${p.total_stock},5\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Sharadha_Stores_Inventory_Dashboard_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Inventory report downloaded.', 'success')
  }

  // Export wastage and batch expiry log CSV
  const exportWastageCSV = () => {
    if (batches.length === 0) return
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Batch No,Product Name,Mfg Date,Expiry Date,Shelf Life,Current Stock,Wastage Status\n'

    batches.forEach((b) => {
      csvContent += `"${b.batch_code}","${b.product_name}","${formatDateDisplay(b.manufacturing_date)}","${formatDateDisplay(b.expiry_date)}",${b.shelf_life_days},${b.current_stock},"${b.status}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Sharadha_Stores_Wastage_Alert_Log_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Wastage alert log downloaded.', 'success')
  }

  // Print administrative dashboard report
  const printReport = () => {
    window.print()
  }

  // ---------------- DYNAMIC RENDER CALCULATIONS ----------------

  // Filter products for Catalog search
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get distinct categories
  const categoriesList = ['All', ...categories.map(c => c.name)]

  const getLocalDateString = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Create dynamic Monthly Calendar cells based on today's date
  const buildCalendarCells = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-indexed
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const startDayIndex = firstDay.getDay() // 0=Sun, 1=Mon...
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    const cells = []
    
    // Insert empty padding cells for days before the 1st
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({ date: null, currentMonth: false })
    }
    
    // Insert days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const yearStr = currentYear
      const monthStr = String(currentMonth + 1).padStart(2, '0')
      const dateStr = `${yearStr}-${monthStr}-${d.toString().padStart(2, '0')}`
      // Filter batches that expire on this specific day
      const expiringBatches = batches.filter(
        (b) => b.expiry_date === dateStr && b.current_stock > 0
      )
      cells.push({ date: d, dateStr, currentMonth: true, expiringBatches })
    }
    
    return cells
  }

  const calendarCells = buildCalendarCells()

  if (!currentUser) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Toast Notification */}
        {toast && (
          <div className="toast-wrapper animate-slide-up" style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            background: toast.type === 'danger' ? 'var(--accent-danger)' : 'var(--accent-secondary)',
            color: toast.type === 'danger' ? '#ffffff' : 'var(--bg-primary)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-premium)',
            fontWeight: 600,
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {toast.type === 'danger' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              )}
            </span>
            <span>{toast.message}</span>
          </div>
        )}

        <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-primary)', boxShadow: 'var(--shadow-glow)', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logoImg} alt="Sharadha Stores Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', letterSpacing: '-0.5px', color: 'var(--text-title)', marginBottom: '0.25rem' }}>SHARADHA STORES</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Homemade Foods</p>
          </div>

          <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {isRegisterMode ? (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={registerName} 
                    onChange={(e) => setRegisterName(e.target.value)} 
                    required 
                    placeholder="e.g. Ramesh Kumar" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={registerEmail} 
                    onChange={(e) => setRegisterEmail(e.target.value)} 
                    required 
                    placeholder="e.g. ramesh@gmail.com" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showRegisterPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={registerPassword} 
                      onChange={(e) => setRegisterPassword(e.target.value)} 
                      required 
                      placeholder="••••••••" 
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showRegisterPassword ? (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showRegisterConfirmPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={registerConfirmPassword} 
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)} 
                      required 
                      placeholder="••••••••" 
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showRegisterConfirmPassword ? (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={registerPhone} 
                    onChange={(e) => setRegisterPhone(e.target.value)} 
                    required 
                    placeholder="e.g. 9177661137" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <textarea 
                    className="form-textarea" 
                    value={registerAddress} 
                    onChange={(e) => setRegisterAddress(e.target.value)} 
                    required 
                    placeholder="e.g. 12 Main Road, T-Nagar, Chennai"
                    rows="2"
                    style={{ resize: 'none', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.8rem', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  Create Account
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Email or Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={loginUsername} 
                    onChange={(e) => setLoginUsername(e.target.value)} 
                    required 
                    placeholder="e.g. customer@gmail.com" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showLoginPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      required 
                      placeholder="••••••••" 
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showLoginPassword ? (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Secure Sign In
                </button>
              </>
            )}
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.25rem', marginBottom: 0 }}>
            {isRegisterMode ? (
              <>
                Already have an account?{' '}
                <span 
                  onClick={() => setIsRegisterMode(false)} 
                  style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Sign In
                </span>
              </>
            ) : (
              <>
                New to Sharadha Stores?{' '}
                <span 
                  onClick={() => setIsRegisterMode(true)} 
                  style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Create an Account
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-wrapper animate-slide-up" style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          background: toast.type === 'danger' ? 'var(--accent-danger)' : 'var(--accent-secondary)',
          color: toast.type === 'danger' ? '#ffffff' : 'var(--bg-primary)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-premium)',
          fontWeight: 600,
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {toast.type === 'danger' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon" style={{ borderRadius: '50%', overflow: 'hidden', background: 'none', boxShadow: 'none' }}>
            <img src={logoImg} alt="Sharadha Stores Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="brand-text">
            <h1>SHARADHA STORES</h1>
            <div className="brand-tagline">{activeTab === 'admin' ? 'Homemade Food Tracker' : 'Homemade Foods'}</div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser && currentUser.role === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', marginRight: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{currentUser.role}</span>
            </div>
          )}

          {currentUser && currentUser.role === 'customer' && (
            <>
              {/* Attached Search Bar in Header */}
              <div style={{ display: 'flex', alignItems: 'stretch', height: '32px', marginRight: '0.5rem', position: 'relative' }}>
                <input
                  type="text"
                  className="search-box"
                  placeholder="Search pickles, sweets..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim() !== '') {
                      setSelectedCategory('All');
                    }
                    if (activeTab !== 'ecommerce') {
                      setActiveTab('ecommerce');
                    }
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    // Delay slightly to allow suggestion click events to fire before blur hides the dropdown
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  style={{ 
                    width: '280px',
                    height: '100%',
                    borderTopRightRadius: 0, 
                    borderBottomRightRadius: 0,
                    borderRight: 'none',
                    padding: '0 0.75rem',
                    fontSize: '0.8rem',
                    background: 'var(--bg-tertiary)'
                  }}
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim() !== '') {
                      setSelectedCategory('All');
                    }
                    if (activeTab !== 'ecommerce') {
                      setActiveTab('ecommerce');
                    }
                  }}
                  style={{
                    background: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--bg-primary)',
                    padding: '0 0.6rem',
                    borderTopRightRadius: 'var(--radius-md)',
                    borderBottomRightRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    height: '100%'
                  }}
                  title="Search"
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-secondary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                >
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>

                {/* Suggestions Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="glass-card" style={{
                    position: 'absolute',
                    top: '36px',
                    left: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-glow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No matching products found
                      </div>
                    ) : (
                      products
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                          <div 
                            key={p.product_id}
                            onMouseDown={() => {
                              setSearchQuery(p.name);
                              setSelectedCategory('All');
                              if (activeTab !== 'ecommerce') {
                                setActiveTab('ecommerce');
                              }
                              // Scroll to the product card
                              setTimeout(() => {
                                const el = document.getElementById(`product-card-${p.product_id}`);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el.style.boxShadow = '0 0 15px var(--accent-primary)';
                                  setTimeout(() => {
                                    el.style.boxShadow = '';
                                  }, 2000);
                                }
                              }, 100);
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 159, 28, 0.08)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            <img 
                              src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"}
                              alt=""
                              style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-title)' }}>{p.name}</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category_name}</span>
                                {p.prices && p.prices.length > 0 && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                    Rs. {p.prices[0].price}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
              <div 
                className="cart-indicator animate-pulse-glow" 
                onClick={() => setActiveTab('cart')} 
                title="Cart"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: activeTab === 'cart' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: activeTab === 'cart' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
                  color: activeTab === 'cart' ? 'var(--accent-primary)' : 'var(--text-main)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  position: 'relative',
                  padding: 0,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                {cart.length > 0 && (
                  <div className="cart-badge">{cart.reduce((a, c) => a + c.quantity, 0)}</div>
                )}
              </div>

              <div 
                className="orders-indicator animate-pulse-glow" 
                onClick={() => setActiveTab('my-orders')} 
                title="My Orders"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: activeTab === 'my-orders' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: activeTab === 'my-orders' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
                  color: activeTab === 'my-orders' ? 'var(--accent-primary)' : 'var(--text-main)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  position: 'relative',
                  padding: 0,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>



              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleOpenSettings}
                title="Settings"
                style={{ 
                  border: '1px solid var(--accent-primary)', 
                  color: 'var(--accent-primary)', 
                  background: activeTab === 'settings' ? 'rgba(255, 159, 28, 0.1)' : 'rgba(212, 175, 55, 0.05)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
            </>
          )}

          {currentUser && currentUser.role === 'admin' && (
            <>


              {/* Theme Toggle Button for Admin */}
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                style={{ 
                  border: '1px solid var(--accent-primary)', 
                  color: 'var(--accent-primary)', 
                  background: 'rgba(255, 159, 28, 0.05)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'var(--transition-smooth)',
                  marginRight: '0.25rem'
                }}
              >
                {theme === 'dark' ? (
                  <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>

              {/* Logout Button for Admin (Icon-only) */}
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleLogout}
                title="Logout"
                style={{ 
                  border: '1px solid var(--accent-danger)', 
                  color: 'var(--accent-danger)', 
                  background: 'rgba(255, 90, 95, 0.05)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="container">

        {/* ==================== CUSTOMER SETTINGS ZONE ==================== */}
        {activeTab === 'settings' && currentUser && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* Back Button */}
            <button 
              onClick={() => setActiveTab('ecommerce')}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Storefront
            </button>

            <div className="settings-grid">
              {/* Left Column: Profile Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid var(--border-color)', height: '100%' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255, 159, 28, 0.1)',
                  border: '2px solid var(--accent-primary)',
                  boxShadow: 'var(--shadow-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  fontFamily: 'Outfit',
                  marginBottom: '1.25rem'
                }}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                </div>
                
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-title)', marginBottom: '0.25rem' }}>{currentUser.name}</h3>
                <span className="status-badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(46, 196, 182, 0.1)', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.5rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></span>
                  Verified Member
                </span>
                
                <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Account ID</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>#{currentUser.customer_id}</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    border: '1px solid var(--accent-danger)', 
                    color: 'var(--accent-danger)', 
                    background: 'rgba(255, 90, 95, 0.05)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: 'auto'
                  }}
                >
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </button>
              </div>

              {/* Right Column: Account Details & Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-title)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Account Settings
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View and update your personal information and application preferences.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="settings-fields-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>First Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={settingsFirstName} 
                        onChange={(e) => setSettingsFirstName(e.target.value)} 
                        disabled={!isSettingsEditMode}
                        style={!isSettingsEditMode ? { background: 'transparent', border: 'none', paddingLeft: 0, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' } : { fontSize: '0.95rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Last Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={settingsLastName} 
                        onChange={(e) => setSettingsLastName(e.target.value)} 
                        disabled={!isSettingsEditMode}
                        style={!isSettingsEditMode ? { background: 'transparent', border: 'none', paddingLeft: 0, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' } : { fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  <div className="settings-fields-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={settingsPhone} 
                        onChange={(e) => setSettingsPhone(e.target.value)} 
                        disabled={!isSettingsEditMode}
                        style={!isSettingsEditMode ? { background: 'transparent', border: 'none', paddingLeft: 0, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' } : { fontSize: '0.95rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Gmail (Email Address)</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={settingsEmail} 
                        onChange={(e) => setSettingsEmail(e.target.value)} 
                        disabled={!isSettingsEditMode}
                        style={!isSettingsEditMode ? { background: 'transparent', border: 'none', paddingLeft: 0, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' } : { fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  {/* Profile Details Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    {isSettingsEditMode ? (
                      <>
                        <button 
                          onClick={() => setIsSettingsEditMode(false)}
                          className="btn btn-secondary"
                          style={{ minWidth: '120px', padding: '0.75rem' }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveSettings}
                          className="btn btn-primary"
                          style={{ minWidth: '120px', padding: '0.75rem' }}
                        >
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsSettingsEditMode(true)}
                        className="btn btn-primary"
                        style={{ minWidth: '150px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

                {/* Security & Password Card */}
                <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-title)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg style={{ width: '22px', height: '22px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Security & Password
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Update your account password to keep your account secure.</p>
                  </div>
                  
                  <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Current Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          required
                          value={changePasswordCurrent}
                          onChange={(e) => setChangePasswordCurrent(e.target.value)}
                          placeholder="Enter current password"
                          style={{ fontSize: '0.95rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          required
                          value={changePasswordNew}
                          onChange={(e) => setChangePasswordNew(e.target.value)}
                          placeholder="Min 6 characters"
                          style={{ fontSize: '0.95rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Confirm New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          required
                          value={changePasswordConfirm}
                          onChange={(e) => setChangePasswordConfirm(e.target.value)}
                          placeholder="Re-enter new password"
                          style={{ fontSize: '0.95rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isUpdatingPassword}
                        style={{ minWidth: '160px', padding: '0.75rem' }}
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Card 2: Address Book */}
                <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', color: 'var(--text-title)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Address Book
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Manage your delivery addresses for quick checkouts.</p>
                    </div>
                    {!isAddressFormOpen && (
                      <button 
                        onClick={handleAddAddressClick} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}
                      >
                        <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Address
                      </button>
                    )}
                  </div>

                  {isAddressFormOpen ? (
                    /* Inline Address Form */
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--text-title)', marginBottom: '0.25rem' }}>
                        {editingAddressId === null ? 'Add New Address' : 'Edit Address'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={addressFormFlat} 
                          onChange={(e) => setAddressFormFlat(e.target.value)} 
                          placeholder="Flat, House no., Building, Company, Apartment"
                        />
                        <input 
                          type="text" 
                          className="form-input" 
                          value={addressFormArea} 
                          onChange={(e) => setAddressFormArea(e.target.value)} 
                          placeholder="Area, Street, Sector, Village"
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr', gap: '1rem' }} className="settings-address-grid">
                          <input 
                            type="text" 
                            className="form-input" 
                            value={addressFormPincode} 
                            onChange={(e) => setAddressFormPincode(e.target.value)} 
                            placeholder="Pincode"
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            value={addressFormCity} 
                            onChange={(e) => setAddressFormCity(e.target.value)} 
                            placeholder="Town/ City"
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            value={addressFormState} 
                            onChange={(e) => setAddressFormState(e.target.value)} 
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button 
                          onClick={() => { setIsAddressFormOpen(false); setEditingAddressId(null); }} 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveAddressBookItem} 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Saved Addresses List */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {addressBook.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                          No saved addresses found. Please add a delivery address.
                        </div>
                      ) : (
                        addressBook.map((addr) => (
                          <div 
                            key={addr.id} 
                            style={{ 
                              border: addr.isDefault ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', 
                              borderRadius: 'var(--radius-md)', 
                              padding: '1.25rem', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              gap: '1.5rem',
                              background: addr.isDefault ? 'rgba(255, 159, 28, 0.02)' : 'transparent',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: 'var(--text-title)', fontSize: '0.95rem' }}>
                                  {addr.flat}
                                </strong>
                                {addr.isDefault && (
                                  <span style={{ background: 'rgba(255, 159, 28, 0.1)', color: 'var(--accent-primary)', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Default
                                  </span>
                                )}
                              </div>
                              <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{addr.area}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={() => handleEditAddressClick(addr)} 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Edit Address"
                                >
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteAddressItem(addr.id)} 
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', background: 'rgba(255, 90, 95, 0.02)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Delete Address"
                                >
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  Delete
                                </button>
                              </div>
                              {!addr.isDefault && (
                                <button 
                                  onClick={() => handleSetDefaultAddress(addr.id)} 
                                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Card 3: Appearance Preferences */}
                <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-title)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                      Appearance Preferences
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Choose between light and dark modes.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: theme === 'dark' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
                        color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                      Dark Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: theme === 'light' ? 'rgba(255, 159, 28, 0.1)' : 'transparent',
                        color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                      Light Mode
                    </button>
                  </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== CUSTOMER SHOPPING CART ZONE ==================== */}
        {activeTab === 'cart' && currentUser && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* Back Button */}
            <button 
              onClick={() => setActiveTab('ecommerce')}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Continue Shopping
            </button>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
              {/* Left Column: Cart items & address book */}
              <div style={{ flex: '1.6 1 600px', display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '0' }}>
                {/* Cart Items List */}
                <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', color: 'var(--text-title)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        Your Shopping Cart
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review your items and adjust quantities.</p>
                    </div>
                    {cart.length > 0 && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setCart([])}
                        style={{ border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        Clear Cart
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '64px', height: '64px', opacity: 0.3, color: 'var(--text-muted)' }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Your shopping cart is empty.</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('ecommerce')}>Go to Storefront</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {cart.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1.5rem', 
                            padding: '1.25rem', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 255, 255, 0.01)',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <img 
                            src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"} 
                            alt="" 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-title)' }}>{item.name}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pack: {item.qty_desc}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Rs. {item.price} each</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.8rem' }}>
                            <button 
                              className="cart-qty-btn" 
                              onClick={() => updateCartQuantity(idx, -1)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
                            >-</button>
                            <span style={{ fontWeight: 700, fontSize: '1rem', width: '25px', textAlign: 'center', color: 'var(--text-title)' }}>
                              {item.quantity}
                            </span>
                            <button 
                              className="cart-qty-btn" 
                              onClick={() => updateCartQuantity(idx, 1)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
                            >+</button>
                          </div>
                          
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => updateCartQuantity(idx, -item.quantity)}
                            style={{ padding: '0.5rem', minWidth: 'auto', border: '1px solid var(--accent-danger)', color: 'var(--accent-danger)', background: 'rgba(255, 90, 95, 0.02)' }}
                            title="Remove item"
                          >
                            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Address Card */}
                {cart.length > 0 && (
                  <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {isCartAddressFormOpen ? (
                      /* Inline Address Form in Cart */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--text-title)', marginBottom: '0.25rem' }}>
                          Add Shipping Address
                        </h4>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={cartFormFlat} 
                          onChange={(e) => setCartFormFlat(e.target.value)} 
                          placeholder="Flat, House no., Building, Company, Apartment"
                        />
                        <input 
                          type="text" 
                          className="form-input" 
                          value={cartFormArea} 
                          onChange={(e) => setCartFormArea(e.target.value)} 
                          placeholder="Area, Street, Sector, Village"
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 2fr', gap: '1rem' }} className="settings-address-grid">
                          <input 
                            type="text" 
                            className="form-input" 
                            value={cartFormPincode} 
                            onChange={(e) => setCartFormPincode(e.target.value)} 
                            placeholder="Pincode"
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            value={cartFormCity} 
                            onChange={(e) => setCartFormCity(e.target.value)} 
                            placeholder="Town/ City"
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            value={cartFormState} 
                            onChange={(e) => setCartFormState(e.target.value)} 
                            placeholder="State"
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                          <button 
                            onClick={() => { setIsCartAddressFormOpen(false); }} 
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1.25rem' }}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveCartAddressBookItem} 
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1.25rem' }}
                          >
                            Save & Select
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Selectable Address List in Cart */
                      <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-title)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Delivery Address *
                          </h3>
                          <button 
                            onClick={() => setIsCartAddressFormOpen(true)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add New
                          </button>
                        </div>
                        
                        {addressBook.length === 0 ? (
                          <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', fontStyle: 'italic', padding: '1.5rem', border: '1px dashed var(--accent-danger)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            No delivery addresses found. Please add a shipping address.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                            {addressBook.map((addr) => {
                              const isSelected = String(selectedCartAddressId) === String(addr.id);
                              return (
                                <div 
                                  key={addr.id}
                                  onClick={() => {
                                    setSelectedCartAddressId(String(addr.id));
                                    setCartAddressFlat(addr.flat);
                                    setCartAddressArea(addr.area);
                                    setCartAddressPincode(addr.pincode);
                                    setCartAddressCity(addr.city);
                                    setCartAddressState(addr.state);
                                  }}
                                  style={{
                                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgba(255, 159, 28, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                                    transition: 'var(--transition-smooth)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    name="cartPageShippingAddress"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    style={{ marginTop: '4px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-title)' }}>
                                        {addr.flat}
                                      </span>
                                      {addr.isDefault && (
                                        <span style={{ background: 'rgba(255, 159, 28, 0.1)', color: 'var(--accent-primary)', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{addr.area}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {addr.city}, {addr.state} - {addr.pincode}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary Card */}
              {cart.length > 0 && (
                <div style={{ flex: '1 1 350px', position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '300px' }}>
                  <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem', color: 'var(--text-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                      Order Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        <span>Items Subtotal</span>
                        <strong>Rs. {cart.reduce((a, c) => a + c.price * c.quantity, 0)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span>Delivery Charges</span>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>FREE</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--text-title)', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                        <span>Total Amount</span>
                        <strong style={{ color: 'var(--accent-primary)' }}>Rs. {cart.reduce((a, c) => a + c.price * c.quantity, 0)}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      {checkoutStatus === 'processing' ? (
                        <button className="btn btn-primary btn-full" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled>
                          <svg className="animate-spin" style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                          Validating Batch Stocks via FEFO...
                        </button>
                      ) : checkoutStatus === 'success' ? (
                        <button className="btn btn-primary btn-full" style={{ padding: '0.85rem', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled>
                          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Order Placed Successfully!
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary btn-full" 
                          onClick={handleCheckoutClick} 
                          disabled={addressBook.length === 0}
                          style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                          Checkout Now
                        </button>
                      )}
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem', lineHeight: '1.3' }}>
                        Our system utilizes FEFO (First-Expired, First-Out) inventory allocation. Your items will be dispatched from our freshest unexpired batches.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== CUSTOMER ORDERS ZONE ==================== */}
        {activeTab === 'my-orders' && currentUser && (
          <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* Back Button */}
            <button 
              onClick={() => setActiveTab('ecommerce')}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Storefront
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2.5rem 3rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-title)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    My Order History
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track and view details of all your placed orders.</p>
                </div>

                {orders.filter(o => String(o.customer_email) === String(currentUser?.email)).length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1rem', textAlign: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '64px', height: '64px', opacity: 0.3, color: 'var(--text-muted)' }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>You haven't placed any orders yet.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('ecommerce')}>Start Shopping</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {orders
                      .filter(o => String(o.customer_email) === String(currentUser?.email))
                      .map((order) => (
                        <div 
                          key={order.order_id} 
                          className="glass-card" 
                          style={{ 
                            padding: '2rem', 
                            border: '1px solid var(--border-color)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1.5rem',
                            background: 'rgba(255, 255, 255, 0.01)'
                          }}
                        >
                          {/* Order Header Info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-title)' }}>Order #{order.order_id}</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Placed on: {order.order_date}</span>
                            </div>
                            <span style={{ 
                              background: order.status === 'Paid' ? 'rgba(46, 196, 182, 0.15)' : 'rgba(255, 159, 28, 0.15)',
                              color: order.status === 'Paid' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {order.status === 'Paid' ? 'Delivered' : 'Pending (COD)'}
                            </span>
                          </div>

                          {/* Order Items */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                            {order.items && order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--text-main)' }}>
                                  {item.product_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({item.quantity_description})</span> x <strong>{item.quantity}</strong>
                                </span>
                                <strong style={{ color: 'var(--text-title)' }}>Rs. {item.price_paid * item.quantity}</strong>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--accent-primary)' }}>
                              <span>Total Amount</span>
                              <span>Rs. {order.total_amount}</span>
                            </div>
                          </div>

                          {/* Delivery Details */}
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                            <strong style={{ color: 'var(--text-title)', display: 'block', marginBottom: '0.5rem' }}>Delivery Address:</strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                              {order.customer_address}
                            </p>
                          </div>


                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* ==================== A. CUSTOMER E-COMMERCE ZONE ==================== */}
        {activeTab === 'ecommerce' && (
          <div className="animate-fade-in">
            {/* Categories Section - arranged side-by-side at the top of the slideshow */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <div className="glass-card animate-slide-up" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'var(--shadow-glow)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {categoriesList.map((cat) => {
                  const count = cat === 'All' 
                    ? products.length 
                    : products.filter(p => p.category_name === cat).length
                  const isActive = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      className={`category-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        position: 'relative',
                        width: 'auto',
                        padding: '0.5rem 1.2rem',
                        borderRadius: '24px',
                        border: isActive ? '1px solid rgba(255, 159, 28, 0.3)' : '1px solid transparent',
                        background: isActive ? 'rgba(255, 159, 28, 0.12)' : 'transparent',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <span>{cat}</span>
                      <span 
                        className="category-count"
                        style={{
                          fontSize: '0.75rem',
                          background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? 'var(--bg-primary)' : 'var(--text-muted)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: isActive ? 700 : 'normal',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Large Featured Slideshow Carousel */}
            {searchQuery.trim() === '' && selectedCategory === 'All' && (
              <div className="glass-card storefront-slideshow" style={{
                position: 'relative',
                overflow: 'hidden',
                height: '460px',
                padding: 0,
                marginBottom: '2.5rem',
                borderRadius: 0,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: '1px solid rgba(212, 175, 55, 0.18)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
                boxShadow: '0 8px 32px 0 rgba(212, 175, 55, 0.08)',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)'
              }}>
                {/* Slides */}
                {slides.map((slide, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,10,2,0.92) 90%), url(${slide.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: currentSlide === idx ? 1 : 0,
                      transition: 'opacity 1s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '3rem calc(max(1.5rem, 50vw - 680px))',
                      pointerEvents: currentSlide === idx ? 'auto' : 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div className="animate-slide-up" style={{ zIndex: 2, maxWidth: '750px', boxSizing: 'border-box' }}>
                      <span style={{
                        background: 'rgba(212, 175, 55, 0.25)',
                        border: '1px solid var(--accent-primary)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        display: 'inline-block',
                        marginBottom: '0.75rem'
                      }}>Featured Collection</span>
                      <h3 style={{
                        fontFamily: 'Outfit',
                        fontSize: '2.6rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0 0 0.75rem 0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        lineHeight: '1.2'
                      }}>
                        {slide.title}
                      </h3>
                      <p style={{
                        fontSize: '1.1rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: 0,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        lineHeight: '1.5'
                      }}>
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Left Arrow */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: 'calc(max(2rem, 50vw - 660px))',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.3s'
                  }}
                  className="slider-arrow-btn"
                >
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    right: 'calc(max(2rem, 50vw - 660px))',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.3s'
                  }}
                  className="slider-arrow-btn"
                >
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>

                {/* Dot Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  right: 'calc(max(2rem, 50vw - 660px))',
                  display: 'flex',
                  gap: '0.4rem',
                  zIndex: 3
                }}>
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      style={{
                        width: currentSlide === idx ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: currentSlide === idx ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="catalog-layout" style={{ gridTemplateColumns: '1fr' }}>

              {/* Product Catalog Grid */}
              <section className="catalog-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Our Fresh Homemade Catalog</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Showing {filteredProducts.length} items
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="glass-card empty-state">
                    <div className="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', opacity: 0.5 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    </div>
                    <p>No products found matching your filter criteria.</p>
                  </div>
                ) : (
                  (() => {
                    const activeCategories = selectedCategory === 'All'
                      ? [...new Set(filteredProducts.map(p => p.category_name))]
                      : [selectedCategory];
                    
                    return activeCategories.map((catName) => {
                      const catProducts = filteredProducts.filter(p => p.category_name === catName);
                      if (catProducts.length === 0) return null;
                      return (
                        <div key={catName} className="category-group" style={{ marginBottom: '2.5rem' }}>
                          <h3 className="category-group-title" style={{
                            fontFamily: 'Outfit',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingBottom: '0.4rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            {catName}
                          </h3>

                          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                            {/* Left Prev Button */}
                            {catProducts.length > 4 && (
                              <button
                                onClick={() => {
                                  const container = document.getElementById(`carousel-${catName.replace(/\s+/g, '-')}`);
                                  if (container) {
                                    const card = container.querySelector('.carousel-card-wrapper');
                                    if (card) {
                                      container.scrollLeft -= (card.offsetWidth + 28);
                                    }
                                  }
                                }}
                                title="Previous"
                                className="carousel-btn carousel-btn-prev"
                              >
                                <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                            )}


                            {/* Carousel Container */}
                            <div id={`carousel-${catName.replace(/\s+/g, '-')}`} className="carousel-container" style={{ width: '100%' }}>
                              {catProducts.map((p) => {
                                // Manage selected package size price
                                const selectedPriceIdx = selectedPrices[p.product_id] || 0
                                const activePrice = p.prices[selectedPriceIdx] || p.prices[0]

                                return (
                                  <div key={p.product_id} className="carousel-card-wrapper">
                                    <div id={`product-card-${p.product_id}`} className="glass-card product-card animate-slide-up" style={{ height: '100%' }}>
                                      <div className="product-img-wrapper">
                                        <img src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"} alt={p.name} className="product-img" />
                                        <span className="shelf-life-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                          Shelf Life: {p.shelf_life_days}d
                                        </span>
                                      </div>

                                      <div className="product-info">
                                        <h3 className="product-title">{p.name}</h3>
                                        <p className="product-desc">{p.description}</p>

                                        {/* Stock Indicator */}
                                        <div className="product-stock-status">
                                          <span className={`stock-dot ${
                                            p.total_stock > 5 ? 'in-stock' : p.total_stock > 0 ? 'low-stock' : 'out-of-stock'
                                          }`}></span>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {p.total_stock > 5 
                                              ? `In Stock (${p.total_stock} units)` 
                                              : p.total_stock > 0 
                                                ? `Low Stock (${p.total_stock} units left!)` 
                                                : 'Out of Stock'}
                                          </span>
                                        </div>

                                        {/* Pricing & Size Selection */}
                                        <div className="price-selector-wrapper">
                                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Pack Size & Price:
                                          </label>
                                          <select
                                            className="price-select"
                                            value={selectedPriceIdx}
                                            onChange={(e) => setSelectedPrices({
                                              ...selectedPrices,
                                              [p.product_id]: parseInt(e.target.value)
                                            })}
                                          >
                                            {p.prices.map((pr, idx) => (
                                              <option key={pr.price_id} value={idx}>
                                                {pr.quantity_description} - Rs. {pr.price}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Card Buttons */}
                                        <div className="product-card-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: 'auto' }}>
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setSelectedProductForRecipe(p)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0.4rem 0.25rem', fontSize: '0.75rem' }}
                                          >
                                            <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                            Recipe
                                          </button>
                                          <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleAddToCart(p, activePrice)}
                                            disabled={p.total_stock <= 0}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0.4rem 0.25rem', fontSize: '0.75rem' }}
                                          >
                                            {p.total_stock <= 0 ? 'Sold Out' : (
                                              <>
                                                <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                                Add
                                              </>
                                            )}
                                          </button>
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0.4rem 0.25rem', fontSize: '0.75rem' }}
                                            onClick={() => {
                                              const selectedPriceIdx = selectedPrices[p.product_id] || 0
                                              const activePrice = p.prices[selectedPriceIdx] || p.prices[0]
                                              handleAddToCart(p, activePrice)
                                              setActiveTab('cart')
                                            }}
                                          >
                                            <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                                            Order
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Right Next Button */}
                            {catProducts.length > 4 && (
                              <button
                                onClick={() => {
                                  const container = document.getElementById(`carousel-${catName.replace(/\s+/g, '-')}`);
                                  if (container) {
                                    const card = container.querySelector('.carousel-card-wrapper');
                                    if (card) {
                                      container.scrollLeft += (card.offsetWidth + 28);
                                    }
                                  }
                                }}
                                title="Next"
                                className="carousel-btn carousel-btn-next"
                              >
                                <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                            )}

                          </div>
                        </div>
                      )
                    })
                  })()
                )}
              </section>
            </div>

          {/* Customer Portal Footer Section */}
          <footer className="glass-card storefront-footer" style={{
            marginTop: '4rem',
            padding: '5rem calc(max(2rem, 50vw - 680px)) 3rem',
            borderTop: '1px solid rgba(212, 175, 55, 0.18)',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(15,10,2,0.6) 100%)',
            borderRadius: 0,
            boxShadow: '0 -4px 32px 0 rgba(212, 175, 55, 0.03)',
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            boxSizing: 'border-box'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'start'
            }}>
              {/* Column 1: Store Brand */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontFamily: 'Outfit', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-title)', fontSize: '1.1rem' }}>SHARADHA STORES</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  Authentic homemade pickles, sweets, and spice powders crafted with traditional recipes and love.
                </p>
              </div>

              {/* Column 2: Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--accent-primary)', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Address
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  Jubilee hills road no 5,
                  oppsite GVK One Mall,
                  Hyderabad, Telangana,
                  India.
                </p>
              </div>

              {/* Column 3: Contact & Queries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--accent-primary)', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Contact Us
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0', lineHeight: '1.4' }}>
                  Phone No: <strong>+91 9177661137</strong>
                </p>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--accent-primary)', margin: '0.5rem 0 0 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  For Queries
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  Gmail: <a href="mailto:sharadhastores4@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>sharadhastores4@gmail.com</a>
                </p>
              </div>
            </div>

            {/* Bottom Copyright bar */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              &copy; {new Date().getFullYear()} Sharadha Stores. All rights reserved.
            </div>
          </footer>
          </div>
        )}

        {/* ==================== B. STORE ADMIN & DASHBOARD ZONE ==================== */}
        {activeTab === 'admin' && currentUser && currentUser.role === 'admin' && (() => {
          // 1. Data Calculations for Sales & Revenue Analytics
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          const currentYearStr = String(currentYear);
          const currentMonthStr = String(currentMonth).padStart(2, '0');
          const thisMonthPrefix = `${currentYearStr}-${currentMonthStr}`;

          // Filter Paid orders for this month and whole year
          const thisMonthOrders = orders.filter(o => o.status === 'Paid' && o.order_date.startsWith(thisMonthPrefix));
          const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total_amount, 0);

          const wholeYearOrders = orders.filter(o => o.status === 'Paid' && o.order_date.startsWith(currentYearStr));
          const wholeYearRevenue = wholeYearOrders.reduce((sum, o) => sum + o.total_amount, 0);

          const annualOrdersCount = wholeYearOrders.length;
          const annualAOV = annualOrdersCount > 0 ? wholeYearRevenue / annualOrdersCount : 0;

          // Group daily data for June 2026 (or current month)
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
          const dailyDataMap = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            revenue: 0,
            ordersCount: 0
          }));

          orders.forEach(order => {
            if (order.status !== 'Paid') return;
            if (order.order_date.startsWith(thisMonthPrefix)) {
              const day = parseInt(order.order_date.substring(8, 10), 10);
              if (day >= 1 && day <= daysInMonth) {
                dailyDataMap[day - 1].revenue += order.total_amount;
                dailyDataMap[day - 1].ordersCount += 1;
              }
            }
          });

          // Group monthly data for Whole Year 2026 (12 months)
          const monthsMap = [
            { name: "Jan", revenue: 0, ordersCount: 0 },
            { name: "Feb", revenue: 0, ordersCount: 0 },
            { name: "Mar", revenue: 0, ordersCount: 0 },
            { name: "Apr", revenue: 0, ordersCount: 0 },
            { name: "May", revenue: 0, ordersCount: 0 },
            { name: "Jun", revenue: 0, ordersCount: 0 },
            { name: "Jul", revenue: 0, ordersCount: 0 },
            { name: "Aug", revenue: 0, ordersCount: 0 },
            { name: "Sep", revenue: 0, ordersCount: 0 },
            { name: "Oct", revenue: 0, ordersCount: 0 },
            { name: "Nov", revenue: 0, ordersCount: 0 },
            { name: "Dec", revenue: 0, ordersCount: 0 }
          ];

          orders.forEach(order => {
            if (order.status !== 'Paid') return;
            if (order.order_date.startsWith(currentYearStr)) {
              const month = parseInt(order.order_date.substring(5, 7), 10);
              if (month >= 1 && month <= 12) {
                monthsMap[month - 1].revenue += order.total_amount;
                monthsMap[month - 1].ordersCount += 1;
              }
            }
          });

          // Product rankings & contribution share
          const productStats = {};
          products.forEach(p => {
            productStats[p.name] = {
              name: p.name,
              category: p.category_name || (categories.find(c => c.category_id === p.category_id)?.name || "General"),
              unitsSold: 0,
              revenue: 0
            };
          });

          orders.forEach(order => {
            if (order.status !== 'Paid') return;
            order.items.forEach(item => {
              const pName = item.product_name;
              const qty = item.quantity;
              const pricePaid = item.price_paid || 0;
              const revenue = qty * pricePaid;
              
              if (!productStats[pName]) {
                productStats[pName] = {
                  name: pName,
                  category: "General",
                  unitsSold: 0,
                  revenue: 0
                };
              }
              productStats[pName].unitsSold += qty;
              productStats[pName].revenue += revenue;
            });
          });

          const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
          const totalCombinedProductRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0) || 1;

          // Category share
          const categoryStats = {};
          categories.forEach(c => {
            categoryStats[c.name] = { name: c.name, revenue: 0 };
          });

          topProducts.forEach(p => {
            const catName = p.category;
            if (!categoryStats[catName]) {
              categoryStats[catName] = { name: catName, revenue: 0 };
            }
            categoryStats[catName].revenue += p.revenue;
          });

          const categoryRevenueList = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
          const maxCategoryRevenue = Math.max(...categoryRevenueList.map(c => c.revenue), 1) || 1;

          // SVG line/bar dimensions
          const padding = { top: 20, right: 20, bottom: 35, left: 55 };
          const width = 600;
          const height = 240;
          const chartWidth = width - padding.left - padding.right;
          const chartHeight = height - padding.top - padding.bottom;

          // Process daily trend points
          const maxDailyRev = Math.max(...dailyDataMap.map(d => d.revenue), 100);
          const dailyPoints = dailyDataMap.map((d, index) => {
            const x = padding.left + (index / (daysInMonth - 1)) * chartWidth;
            const y = padding.top + chartHeight - (d.revenue / maxDailyRev) * chartHeight;
            return { x, y, day: d.day, revenue: d.revenue, ordersCount: d.ordersCount };
          });

          const linePath = dailyPoints.reduce((path, p, i) => {
            return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
          }, "");

          const areaPath = dailyPoints.length > 0
            ? `${linePath} L ${dailyPoints[dailyPoints.length - 1].x} ${padding.top + chartHeight} L ${dailyPoints[0].x} ${padding.top + chartHeight} Z`
            : "";

          // Process monthly bars
          const maxMonthlyRev = Math.max(...monthsMap.map(m => m.revenue), 1000);
          const slotWidth = chartWidth / 12;
          const barWidth = slotWidth * 0.6;

          const monthlyBars = monthsMap.map((m, index) => {
            const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
            const barHeight = (m.revenue / maxMonthlyRev) * chartHeight;
            const y = padding.top + chartHeight - barHeight;
            return {
              x,
              y,
              width: barWidth,
              height: barHeight,
              month: m.name,
              revenue: m.revenue,
              ordersCount: m.ordersCount,
              centerX: x + barWidth / 2,
              centerY: y
            };
          });

          return (
            <div className="animate-fade-in admin-layout-container">
              {/* Sidebar column (left) */}
              <div className="glass-card admin-sidebar">
                <h2 style={{ margin: 0, fontSize: '1.35rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem' }}>Administrator Portal</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('dashboard')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Dashboard
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('orders')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    Customer Orders
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'batches' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('batches')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    Production Batches
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('catalog')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    Catalog
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'simulations' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('simulations')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    API Simulations
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('alerts')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Priority Alerts
                  </button>
                  <button
                    className={`sidebar-tab-btn ${adminSubTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setAdminSubTab('analytics')}
                  >
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><line x1="2" y1="20" x2="22" y2="20"></line></svg>
                    Sales Analytics
                  </button>
                </div>
              </div>

              {/* Content column (right) */}
              <div className="admin-content-pane" style={{ flex: 1, minWidth: 0 }}>
{adminSubTab === 'dashboard' && (
                <>
                                    <div className="dashboard-grid">
              <div 
                className="glass-card stat-card" 
                style={{ borderLeft: '3px solid var(--accent-secondary)', cursor: 'pointer' }}
                onClick={() => setAdminSubTab('orders')}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Revenue Generated</div>
                  <div className="stat-num" style={{ color: 'var(--accent-secondary)' }}>
                    Rs. {dashboardSummary ? dashboardSummary.total_revenue.toLocaleString() : 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>Total Sales Value</div>
                </div>
                <div className="stat-icon" style={{ color: 'var(--accent-secondary)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
              </div>

              <div 
                className="glass-card stat-card" 
                style={{ cursor: 'pointer' }}
                onClick={() => setAdminSubTab('batches')}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Batches</div>
                  <div className="stat-num">
                    {dashboardSummary ? dashboardSummary.active_batches_count + dashboardSummary.near_expiry_batches_count : 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>Ready for Dispatch</div>
                </div>
                <div className="stat-icon" style={{ color: 'var(--text-muted)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17.08 12 22.08"></polygon><polygon points="12 2 21 6.92 12 12 3 6.92 12 2"></polygon></svg></div>
              </div>

              <div 
                className="glass-card stat-card" 
                style={{ borderLeft: '3px solid var(--accent-primary)', cursor: 'pointer' }}
                onClick={() => setAdminSubTab('alerts')}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Low Stock Indicators</div>
                  <div className="stat-num" style={{ color: 'var(--accent-primary)' }}>
                    {dashboardSummary ? dashboardSummary.low_stock_list.length : 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Below Safety Levels</div>
                </div>
                <div className="stat-icon" style={{ color: 'var(--accent-primary)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
              </div>

              <div 
                className="glass-card stat-card" 
                style={{ borderLeft: '3px solid var(--accent-danger)', cursor: 'pointer' }}
                onClick={() => setAdminSubTab('alerts')}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Near Expiry Batches</div>
                  <div className="stat-num" style={{ color: 'var(--accent-danger)' }}>
                    {dashboardSummary ? dashboardSummary.near_expiry_batches_count : 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>Spoilage Wastage Risk</div>
                </div>
                <div className="stat-icon" style={{ color: 'var(--accent-danger)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
              </div>

              <div className="glass-card stat-card">
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Expired Wastage</div>
                  <div className="stat-num">
                    {dashboardSummary ? dashboardSummary.expired_wastage_units : 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discarded Stock</div>
                </div>
                <div className="stat-icon" style={{ color: 'var(--text-muted)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></div>
              </div>
            </div>
                  
                  <div className="dashboard-sections" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
                                      <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Expiry Calendar</h2>
                    <span className="badge badge-info">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Visual tracking mapped dynamically to batch shelf life dates.
                  </p>

                  <div className="calendar-wrapper">
                    <div className="calendar-grid">
                      {/* Day Headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="calendar-day-header">{d}</div>
                      ))}
                      
                      {/* Cells */}
                      {calendarCells.map((cell, idx) => (
                        <div
                          key={idx}
                          className={`calendar-cell ${cell.currentMonth ? 'current-month' : ''} ${
                            cell.dateStr === getLocalDateString(new Date()) ? 'today' : ''
                          }`}
                        >
                          <div className="calendar-date-number">{cell.date || ''}</div>
                          <div className="calendar-events">
                            {cell.expiringBatches && cell.expiringBatches.map((b) => (
                              <div
                                key={b.batch_id}
                                className={`calendar-event-tag ${
                                  b.status === 'Near Expiry' ? 'warning' : b.status === 'Expired' ? 'danger' : 'safe'
                                }`}
                                onClick={() => openBatchDetails(b.batch_id)}
                                title={`${b.product_name} (${b.batch_code})`}
                                style={{ cursor: 'pointer' }}
                              >
                                {b.batch_code} ({b.current_stock})
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                    </div>
                  </div>
                </>
              )}

              {adminSubTab === 'orders' && (
              <div className="glass-card animate-slide-up" style={{ marginTop: '2rem' }} id="customer-orders-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ margin: 0 }}>Customer Orders</h2>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        paddingLeft: '2rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        minWidth: '200px',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <svg style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {orders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders placed yet.</p>
                  ) : (
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Order No</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Items</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th>Method</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...orders]
                          .filter((ord) => {
                            if (!orderSearchQuery) return true;
                            const q = orderSearchQuery.toLowerCase();
                            const orderIdStr = String(ord.order_id);
                            const customerName = ord.customer_name?.toLowerCase() || '';
                            const customerAddress = ord.customer_address?.toLowerCase() || '';
                            const paymentMethod = ord.payment_method?.toLowerCase() || '';
                            const status = ord.status?.toLowerCase() || '';
                            const phoneOrEmail = (ord.customer_phone || ord.customer_email || '').toLowerCase();
                            const itemsText = ord.items ? ord.items.map(it => it.product_name.toLowerCase()).join(' ') : '';
                            return (
                              orderIdStr.includes(q) ||
                              customerName.includes(q) ||
                              customerAddress.includes(q) ||
                              paymentMethod.includes(q) ||
                              status.includes(q) ||
                              phoneOrEmail.includes(q) ||
                              itemsText.includes(q)
                            );
                          })
                          .sort((a, b) => a.order_id - b.order_id)
                          .map((ord) => (
                            <tr key={ord.order_id}>
                              <td><strong>{ord.order_id}</strong></td>
                              <td>
                                <div><strong>{ord.customer_name}</strong></div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_phone || ord.customer_email}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.customer_address}>
                                  {ord.customer_address || 'N/A'}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {ord.items && ord.items.map((it, idx) => (
                                  <div key={idx}>
                                    {it.product_name} ({it.quantity_description}) x {it.quantity}
                                  </div>
                                ))}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <strong>{ord.items ? ord.items.reduce((acc, item) => acc + item.quantity, 0) : 0}</strong>
                              </td>
                              <td><strong>Rs. {ord.total_amount}</strong></td>
                              <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {ord.payment_method || 'N/A'}
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {ord.order_date ? formatDateDisplay(ord.order_date.split(' ')[0]) : 'N/A'}
                              </td>
                              <td>
                                <span className={`badge ${ord.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {ord.status === 'Pending' ? (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleFulfillOrder(ord.order_id)}
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      Fulfill
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</span>
                                  )}
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteOrder(ord.order_id)}
                                    title="Delete Order"
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'rgba(255, 90, 95, 0.12)',
                                      border: '1px solid rgba(255, 90, 95, 0.2)',
                                      color: 'var(--accent-danger)',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

              {adminSubTab === 'batches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                                  {/* 1. Batch Entry Form */}
                 <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                    <h2 style={{ margin: 0 }}>Create Production Batch</h2>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        setNewProductIngSearch('')
                        setIsCreateProductModalOpen(true)
                      }}
                    >
                      <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      New Product
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateBatchSubmit}>
                    <div className="form-inline-group">
                      <div className="form-group">
                        <label className="form-label">Product Name *</label>
                        <select
                          className="form-select"
                          value={formProductId}
                          onChange={(e) => handleFormProductChange(e.target.value)}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>{p.name}</option>
                          ))}
                        </select>
                        {formErrors.productId && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{formErrors.productId}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Pack Size (Weight/Size) *</label>
                        <select
                          className="form-select"
                          value={formPriceId}
                          onChange={(e) => setFormPriceId(e.target.value)}
                          disabled={!formProductId}
                        >
                          <option value="">-- Select Pack Size --</option>
                          {formProductPrices.map((pr) => (
                            <option key={pr.price_id} value={pr.price_id}>
                              {pr.quantity_description} (₹{pr.price})
                            </option>
                          ))}
                        </select>
                        {formErrors.priceId && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{formErrors.priceId}</span>}
                      </div>
                    </div>

                    <div className="form-inline-group">
                      <div className="form-group">
                        <label className="form-label">Batch No *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formBatchCode}
                          onChange={(e) => setFormBatchCode(e.target.value)}
                          placeholder="eg.1"
                        />
                        {formErrors.batchCode && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{formErrors.batchCode}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Quantity Made (Units) *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formQuantityMade}
                          onChange={(e) => handleQuantityMadeChange(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          placeholder="e.g. 50"
                        />
                        {formErrors.qty && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{formErrors.qty}</span>}
                      </div>
                    </div>

                    <div className="form-inline-group">
                      <div className="form-group">
                        <label className="form-label">Shelf Life (Days) *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={formShelfLife}
                          onChange={(e) => setFormShelfLife(e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          placeholder="e.g. 90"
                        />
                        {formErrors.shelfLife && <span style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{formErrors.shelfLife}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Manufacturing Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formMfgDate}
                          onChange={(e) => setFormMfgDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Calculated Expiry date display */}
                    {formMfgDate && formShelfLife && (
                      <div style={{
                        background: 'rgba(255, 159, 28, 0.06)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(255, 159, 28, 0.2)',
                        color: 'var(--accent-primary)'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                          <svg style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          Predicted Expiry:
                        </span> <strong>
                          {(() => {
                            try {
                              const d = new Date(formMfgDate)
                              d.setDate(d.getDate() + parseInt(formShelfLife))
                              return formatDateDisplay(d.toISOString().split('T')[0])
                            } catch (e) { return 'N/A' }
                          })()}
                        </strong>
                      </div>
                    )}

                    {/* Raw Ingredients preview consumption */}
                    {formIngredientsNeeded.length > 0 && (
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Recipe Raw Materials Requirements Preview:</label>
                        <div className="ingredients-check-grid">
                          {formIngredientsNeeded.map((ing) => {
                            const dbIng = ingredients.find(i => i.ingredient_id === ing.ingredient_id)
                            const isInsuf = dbIng ? dbIng.stock_quantity < parseFloat(ing.quantity_used) : false
                            return (
                              <div key={ing.ingredient_id} className="ingredient-check-item" style={{
                                borderColor: isInsuf ? 'var(--accent-danger)' : 'var(--border-color)',
                                background: isInsuf ? 'rgba(255,90,95,0.06)' : 'rgba(255,255,255,0.01)'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{ing.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: isInsuf ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                                    Requires: {ing.quantity_used} {ing.unit}
                                  </div>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                  <span className={`badge ${isInsuf ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                                    {dbIng ? `${dbIng.stock_quantity.toFixed(1)} avl` : '0 avl'}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {formErrors.ingredients && (
                          <div style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            {formErrors.ingredients}
                          </div>
                        )}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Create Production Batch
                    </button>
                  </form>
                  </div>
                              <div className="glass-card animate-slide-up" style={{ marginTop: '2rem' }} id="batches-catalog-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>All Production Batches Catalog</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="search-box"
                    style={{ width: '280px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                    placeholder="Search by product name or batch no..."
                    value={batchesSearchQuery}
                    onChange={(e) => setBatchesSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Batch No</th>
                    <th>Product</th>
                    <th>Pack Size</th>
                    <th>Mfg Date</th>
                    <th>Expiry Date</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedAndFiltered = [...batches]
                      .filter((b) => {
                        const query = batchesSearchQuery.toLowerCase();
                        return b.product_name.toLowerCase().includes(query) ||
                               b.batch_code.toLowerCase().includes(query);
                      })
                      .sort((a, b) => a.batch_code.localeCompare(b.batch_code, undefined, { numeric: true, sensitivity: 'base' }));

                    if (sortedAndFiltered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No batches found matching your search.
                          </td>
                        </tr>
                      );
                    }

                    return sortedAndFiltered.map((b) => (
                      <tr key={b.batch_id}>
                        <td><strong>{b.batch_code}</strong></td>
                        <td>{b.product_name}</td>
                        <td>{b.pack_size || 'N/A'}</td>
                        <td>{formatDateDisplay(b.manufacturing_date)}</td>
                        <td>{formatDateDisplay(b.expiry_date)}</td>
                        <td><strong>{b.current_stock} / {b.quantity_made} units</strong></td>
                        <td>
                          <span className={`badge ${
                            b.status === 'Active' ? 'badge-success' : 
                            b.status === 'Near Expiry' ? 'badge-warning' : 
                            b.status === 'Expired' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openBatchDetails(b.batch_id)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              View Logs
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteBatch(b.batch_id, b.batch_code)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
                </div>
              )}

              {adminSubTab === 'catalog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                      <h2 style={{ margin: 0 }}>Products & Categories Catalog</h2>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          setNewProductIngSearch('')
                          setIsCreateProductModalOpen(true)
                        }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        New Product
                      </button>
                    </div>
                                      {products.length > 0 && (
                    <>
                      <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                            Manage Products Catalog (Delete Products)
                          </label>
                          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <svg style={{ position: 'absolute', left: '8px', width: '12px', height: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                              type="text"
                              placeholder="Search product..."
                              value={catalogDeleteSearchQuery}
                              onChange={(e) => setCatalogDeleteSearchQuery(e.target.value)}
                              style={{
                                width: '160px',
                                padding: '4px 8px 4px 26px',
                                fontSize: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ffffff',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                          gap: '0.5rem', 
                          maxHeight: '120px', 
                          overflowY: 'auto',
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {(() => {
                            const filtered = products.filter(p =>
                              p.name.toLowerCase().includes(catalogDeleteSearchQuery.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return (
                                <div style={{
                                  gridColumn: '1 / -1',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  padding: '1rem'
                                }}>
                                  No matching products found.
                                </div>
                              );
                            }
                            return filtered.map((p) => (
                              <div key={p.product_id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '6px 10px', 
                                background: 'rgba(255, 255, 255, 0.04)', 
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--text-primary)'
                              }}>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '110px' }} title={p.name}>
                                  {p.name}
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: 'var(--accent-primary)', 
                                      cursor: 'pointer',
                                      padding: '0 4px',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onClick={() => openEditProductModal(p)}
                                    title={`Edit ${p.name}`}
                                  >
                                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                                  </button>
                                  <button
                                    type="button"
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: 'var(--accent-danger)', 
                                      cursor: 'pointer',
                                      padding: '0 4px',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onClick={() => handleDeleteProduct(p.product_id, p.name)}
                                    title={`Delete ${p.name}`}
                                  >
                                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                  </button>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                                      {categories.length > 0 && (
                    <>
                      <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                            Manage Categories Catalog (Delete Categories)
                          </label>
                          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <svg style={{ position: 'absolute', left: '8px', width: '12px', height: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                              type="text"
                              placeholder="Search category..."
                              value={categoryDeleteSearchQuery}
                              onChange={(e) => setCategoryDeleteSearchQuery(e.target.value)}
                              style={{
                                width: '160px',
                                padding: '4px 8px 4px 26px',
                                fontSize: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#ffffff',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                          gap: '0.5rem', 
                          maxHeight: '120px', 
                          overflowY: 'auto',
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {(() => {
                            const filtered = categories.filter(c =>
                              c.name.toLowerCase().includes(categoryDeleteSearchQuery.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return (
                                <div style={{
                                  gridColumn: '1 / -1',
                                  textAlign: 'center',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  padding: '1rem'
                                }}>
                                  No matching categories found.
                                </div>
                              );
                            }
                            return filtered.map((c) => (
                              <div key={c.category_id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '6px 10px', 
                                background: 'rgba(255, 255, 255, 0.04)', 
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--text-primary)'
                              }}>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }} title={c.name}>
                                  {c.name}
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: 'var(--accent-danger)', 
                                      cursor: 'pointer',
                                      padding: '0 4px',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onClick={() => handleDeleteCategory(c.category_id, c.name)}
                                    title={`Delete ${c.name}`}
                                  >
                                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                  </button>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                                  <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                    <h2>Raw Materials Inventory</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <svg style={{ position: 'absolute', left: '8px', width: '12px', height: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                          type="text"
                          placeholder="Search material..."
                          value={ingredientSearchQuery}
                          onChange={(e) => setIngredientSearchQuery(e.target.value)}
                          style={{
                            width: '150px',
                            padding: '4px 8px 4px 26px',
                            fontSize: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#ffffff',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsCreateIngredientModalOpen(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Material
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Ingredient</th>
                          <th>Stock</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = ingredients.filter(ing => 
                            ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>
                                  No matching raw materials found.
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((ing) => (
                            <tr key={ing.ingredient_id}>
                              <td><strong>{ing.name}</strong></td>
                              <td>
                                <span className={`badge ${ing.stock_quantity < 20 ? 'badge-warning' : 'badge-success'}`}>
                                  {ing.stock_quantity.toFixed(1)} {ing.unit}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setRefillIngredient(ing)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    Refill
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditIngredientModal(ing)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      border: '1px solid var(--accent-danger)',
                                      color: 'var(--accent-danger)',
                                      background: 'rgba(255, 90, 95, 0.05)',
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    onClick={() => handleDeleteIngredient(ing.ingredient_id, ing.name)}
                                  >
                                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              )}

              {adminSubTab === 'simulations' && (
                <div style={{ marginTop: '1rem' }}>
                                  <div className="glass-card">
                  <h2>WhatsApp / Email API Simulations</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Live status logs from notification engines triggered by batch stock levels.
                  </p>
                  
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {notifications.map((n) => (
                        <div key={n.notification_id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{n.channel} to {n.recipient}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.sent_at}</span>
                          </div>
                          <div style={{ color: 'var(--text-main)' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                </div>
              )}

              {adminSubTab === 'alerts' && (
                <div style={{ marginTop: '1rem' }}>
                                  <div className="glass-card" id="priority-alerts-section">
                  <h2>Priority Alert List</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    High-visibility alert badges for batches at risk of spoilage or low stock.
                  </p>

                  <div className="alert-strip-list">
                    {/* Low Stock alerts */}
                    {dashboardSummary && dashboardSummary.low_stock_list.map((low) => (
                      <div key={low.product_id} className="alert-strip low-stock">
                        <div className="alert-strip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                        <div>
                          <div className="alert-strip-title">{low.product_name} - Low Stock</div>
                          <div className="alert-strip-desc">
                            Aggregate inventory is at <strong>{low.current_stock}</strong> units, which falls below safety level of {low.safety_threshold}.
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Near Expiry alerts */}
                    {batches.filter(b => b.status === 'Near Expiry' && b.current_stock > 0).map((b) => (
                      <div key={b.batch_id} className="alert-strip near-expiry" onClick={() => openBatchDetails(b.batch_id)} style={{ cursor: 'pointer' }}>
                        <div className="alert-strip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                        <div>
                          <div className="alert-strip-title">{b.product_name} ({b.batch_code})</div>
                          <div className="alert-strip-desc">
                            Batch expires on <strong>{formatDateDisplay(b.expiry_date)}</strong>. Spoilage risk for remaining <strong>{b.current_stock}</strong> units!
                          </div>
                        </div>
                      </div>
                    ))}

                    {dashboardSummary && dashboardSummary.low_stock_list.length === 0 && 
                     batches.filter(b => b.status === 'Near Expiry').length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No inventory alerts active.</p>
                    )}
                  </div>
                </div>
                </div>
              )}

              {adminSubTab === 'analytics' && (
                <div style={{ marginTop: '1rem' }}>
                          <>
          {/* Sales & Revenue Analytics page */}
          <div className="analytics-grid-4">
            <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--accent-secondary)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>This Month's Revenue</div>
                <div className="stat-num" style={{ color: 'var(--accent-secondary)' }}>
                  Rs. {thisMonthRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                  {thisMonthOrders.length} Paid Orders in June 2026
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-secondary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>

            <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Annual Revenue (2026)</div>
                <div className="stat-num" style={{ color: 'var(--accent-primary)' }}>
                  Rs. {wholeYearRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                  {annualOrdersCount} Total Paid Orders
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-primary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
            </div>

            <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--accent-info)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Average Order Value</div>
                <div className="stat-num" style={{ color: 'var(--accent-info)' }}>
                  Rs. {Math.round(annualAOV).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-info)' }}>
                  AOV across 2026 orders
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-info)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>

            <div className="glass-card stat-card" style={{ borderLeft: '3px solid var(--text-muted)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sales Metrics</div>
                <div className="stat-num" style={{ color: 'var(--text-title)' }}>
                  {orders.length} Total
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {orders.filter(o => o.status === 'Pending').length} Pending / Unfulfilled
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts-grid">
            {/* Line Chart Card */}
            <div className="glass-card chart-card">
              <div className="chart-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Daily Sales Performance</h3>
                  <span className="chart-title-desc">June 2026 daily revenue trends</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>June 2026</span>
              </div>
              <div className="chart-wrapper">
                <svg viewBox="0 0 600 240" className="chart-svg-container">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                    const yVal = padding.top + chartHeight * (1 - ratio);
                    const gridVal = Math.round(maxDailyRev * ratio);
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} className="chart-grid-line" />
                        <text x={padding.left - 8} y={yVal + 3} className="chart-axis-text" textAnchor="end">
                          Rs.{gridVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = Math.min(1 + i * 5, daysInMonth);
                    const xVal = padding.left + ((day - 1) / (daysInMonth - 1)) * chartWidth;
                    return (
                      <g key={i}>
                        <text x={xVal} y={height - 15} className="chart-axis-text" textAnchor="middle">
                          {day} Jun
                        </text>
                        <line x1={xVal} y1={height - 30} x2={xVal} y2={height - 35} className="chart-axis-line" />
                      </g>
                    );
                  })}

                  {/* Axis Base Line */}
                  <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} className="chart-axis-line" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} className="chart-axis-line" />

                  {/* Area path */}
                  {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}

                  {/* Line path */}
                  {linePath && <path d={linePath} className="chart-line-path" />}

                  {/* Data point circles */}
                  {dailyPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredDailyPoint && hoveredDailyPoint.day === p.day ? 5.5 : 3}
                      className={`chart-dot ${hoveredDailyPoint && hoveredDailyPoint.day === p.day ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredDailyPoint(p)}
                      onMouseLeave={() => setHoveredDailyPoint(null)}
                    />
                  ))}
                </svg>

                {/* Daily Tooltip */}
                {hoveredDailyPoint && (
                  <div 
                    className="chart-tooltip-box"
                    style={{
                      left: `${(hoveredDailyPoint.x / 600) * 100}%`,
                      top: `${(hoveredDailyPoint.y / 240) * 100}%`
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>June {hoveredDailyPoint.day}, 2026</div>
                    <div style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Revenue: Rs. {hoveredDailyPoint.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hoveredDailyPoint.ordersCount} completed orders</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="glass-card chart-card">
              <div className="chart-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Monthly Revenue Performance</h3>
                  <span className="chart-title-desc">Annual performance review by month</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Year 2026</span>
              </div>
              <div className="chart-wrapper">
                <svg viewBox="0 0 600 240" className="chart-svg-container">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>

                  {/* Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                    const yVal = padding.top + chartHeight * (1 - ratio);
                    const gridVal = Math.round(maxMonthlyRev * ratio);
                    return (
                      <g key={i}>
                        <line x1={padding.left} y1={yVal} x2={width - padding.right} y2={yVal} className="chart-grid-line" />
                        <text x={padding.left - 8} y={yVal + 3} className="chart-axis-text" textAnchor="end">
                          Rs.{gridVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {monthlyBars.map((b, i) => (
                    <text key={i} x={b.centerX} y={height - 15} className="chart-axis-text" textAnchor="middle">
                      {b.month}
                    </text>
                  ))}

                  {/* Axis Base Line */}
                  <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} className="chart-axis-line" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} className="chart-axis-line" />

                  {/* Bar Rectangles */}
                  {monthlyBars.map((b, i) => (
                    <rect
                      key={i}
                      x={b.x}
                      y={b.y}
                      width={b.width}
                      height={b.height}
                      rx="3"
                      ry="3"
                      className={`chart-bar-rect ${hoveredMonthlyBar && hoveredMonthlyBar.month === b.month ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredMonthlyBar(b)}
                      onMouseLeave={() => setHoveredMonthlyBar(null)}
                    />
                  ))}
                </svg>

                {/* Monthly Tooltip */}
                {hoveredMonthlyBar && (
                  <div 
                    className="chart-tooltip-box"
                    style={{
                      left: `${(hoveredMonthlyBar.centerX / 600) * 100}%`,
                      top: `${(hoveredMonthlyBar.centerY / 240) * 100}%`
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{hoveredMonthlyBar.month} 2026</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Revenue: Rs. {hoveredMonthlyBar.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hoveredMonthlyBar.ordersCount} completed orders</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products & Category Breakdown */}
          {/* Top Selling Products Table */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Top Selling Products</h3>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Units Sold</th>
                    <th style={{ textAlign: 'right' }}>Revenue Generated</th>
                    <th style={{ width: '150px' }}>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => {
                    const contributionPct = totalCombinedProductRevenue > 0 ? (p.revenue / totalCombinedProductRevenue) * 100 : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-info" style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)', color: 'var(--accent-info)', border: '1px solid rgba(0, 180, 216, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{p.category}</span></td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.unitsSold}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {p.revenue.toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.8rem', width: '36px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {Math.round(contributionPct)}%
                            </span>
                            <div className="progress-bar-container" style={{ margin: 0, flexGrow: 1 }}>
                              <div 
                                className="progress-bar-fill" 
                                style={{ 
                                  width: `${contributionPct}%`,
                                  backgroundColor: idx === 0 ? 'var(--accent-secondary)' : idx === 1 ? 'var(--accent-primary)' : 'var(--text-muted)'
                                }} 
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
                </div>
              )}
              </div>
            </div>
  )})()}

      </main>

      {/* ==================== MODALS & DRAWERS ==================== */}

      {/* 1. Recipe Serving Suggestion Modal */}
      {selectedProductForRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedProductForRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProductForRecipe.name} - Traditional Serving Recipe</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProductForRecipe(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="modal-body">
              <div className="recipe-modal-grid">
                <img src={selectedProductForRecipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"} alt="" className="recipe-image" />
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Instructions:</h3>
                  <p className="recipe-instructions">
                    {selectedProductForRecipe.recipes && selectedProductForRecipe.recipes.length > 0 
                      ? selectedProductForRecipe.recipes[0].instructions 
                      : "Serve in standard plate. Keep in cool dry place."}
                  </p>
                  {selectedProductForRecipe.recipes && selectedProductForRecipe.recipes[0]?.video_url && (
                    <div style={{ marginTop: '1rem' }}>
                      <a
                        href={selectedProductForRecipe.recipes[0].video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        Watch Video Recipe
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Product Modal */}
      {isCreateProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateProductModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Product</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCreateProductModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleCreateProductSubmit} className="modal-body">
              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Tomato Pickle"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. Pickles, Sweets & Snacks"
                    required
                  />
                </div>
              </div>

              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Default Shelf Life (Days) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProductShelfLife}
                    onChange={(e) => setNewProductShelfLife(e.target.value)}
                    placeholder="e.g. 30"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Image URL (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProductImg}
                    onChange={(e) => setNewProductImg(e.target.value)}
                    placeholder="Defaults to a starter image"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  placeholder="Describe your delicious homemade product..."
                ></textarea>
              </div>

              {/* Pricing rows */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pricing Sizes *</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setNewProductPrices([...newProductPrices, { quantity_description: '', price: '' }])}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Size
                  </button>
                </label>
                
                {newProductPrices.map((pr, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={pr.quantity_description}
                      onChange={(e) => {
                        const newPrices = [...newProductPrices]
                        newPrices[idx].quantity_description = e.target.value
                        setNewProductPrices(newPrices)
                      }}
                      placeholder="e.g. 250g Pack"
                      style={{ flex: 2 }}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={pr.price}
                      onChange={(e) => {
                        const newPrices = [...newProductPrices]
                        newPrices[idx].price = e.target.value
                        setNewProductPrices(newPrices)
                      }}
                      placeholder="Price in Rs"
                      style={{ flex: 1 }}
                      min="1"
                      required
                    />
                    {newProductPrices.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          const newPrices = [...newProductPrices]
                          newPrices.splice(idx, 1)
                          setNewProductPrices(newPrices)
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem' }}
                      >
                        <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Recipe instructions */}
              <div className="form-group">
                <label className="form-label">Serving Recipe instructions</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={newProductRecipe}
                  onChange={(e) => setNewProductRecipe(e.target.value)}
                  placeholder="e.g. Serve hot with steamed rice and melted ghee..."
                ></textarea>
              </div>

              {/* Recipe Ingredients checkbox & quantity values list */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Recipe Ingredients & Composition Number per 1 Unit:</span>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <svg style={{ position: 'absolute', left: '8px', width: '11px', height: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                      type="text"
                      placeholder="Search ingredient..."
                      value={newProductIngSearch}
                      onChange={(e) => setNewProductIngSearch(e.target.value)}
                      style={{
                        width: '150px',
                        padding: '3px 8px 3px 24px',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)'
                      }}
                    />
                  </div>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Define which raw materials are consumed when this product is manufactured.
                </p>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  {ingredients.filter(ing => ing.name.toLowerCase().includes(newProductIngSearch.toLowerCase())).length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0.5rem', textAlign: 'center' }}>
                      No matching ingredients found.
                    </div>
                  ) : (
                    ingredients
                      .filter(ing => ing.name.toLowerCase().includes(newProductIngSearch.toLowerCase()))
                      .map((ing) => {
                        const ratioObj = newProductIngredients[ing.ingredient_id]
                        const ratioVal = ratioObj ? ratioObj.value : ''
                        const ratioUnit = ratioObj ? ratioObj.unit : getDefaultUnit(ing.unit)
                        const availableUnits = getAvailableUnits(ing.unit)
                        return (
                          <div key={ing.ingredient_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <input
                              type="checkbox"
                              id={`new-ing-${ing.ingredient_id}`}
                              checked={ing.ingredient_id in newProductIngredients}
                              onChange={(e) => {
                                const newIngs = { ...newProductIngredients }
                                if (e.target.checked) {
                                  newIngs[ing.ingredient_id] = { value: '', unit: getDefaultUnit(ing.unit) }
                                } else {
                                  delete newIngs[ing.ingredient_id]
                                }
                                  setNewProductIngredients(newIngs)
                              }}
                            />
                            <label htmlFor={`new-ing-${ing.ingredient_id}`} style={{ fontSize: '0.85rem', flexGrow: 1 }}>{ing.name} ({ing.unit})</label>
                            {ing.ingredient_id in newProductIngredients && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  step="1"
                                  className="form-input"
                                  style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                  value={ratioVal}
                                  onChange={(e) => {
                                    setNewProductIngredients({
                                      ...newProductIngredients,
                                      [ing.ingredient_id]: { value: e.target.value, unit: ratioUnit }
                                    })
                                  }}
                                  placeholder="Number"
                                  min="1"
                                  required
                                />
                                <select
                                  className="form-input"
                                  style={{ width: '65px', padding: '0.25rem 0.35rem', fontSize: '0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                                  value={ratioUnit}
                                  onChange={(e) => {
                                    setNewProductIngredients({
                                      ...newProductIngredients,
                                      [ing.ingredient_id]: { value: ratioVal, unit: e.target.value }
                                    })
                                  }}
                                >
                                  {availableUnits.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Create Product & Save to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditProductModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditProductModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleEditProductSubmit} className="modal-body">
              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    placeholder="e.g. Tomato Pickle"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProductCategoryName}
                    onChange={(e) => setEditProductCategoryName(e.target.value)}
                    placeholder="e.g. Pickles, Sweets & Snacks"
                    required
                  />
                </div>
              </div>

              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Default Shelf Life (Days) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editProductShelfLife}
                    onChange={(e) => setEditProductShelfLife(e.target.value)}
                    placeholder="e.g. 30"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Image URL (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editProductImg}
                    onChange={(e) => setEditProductImg(e.target.value)}
                    placeholder="Defaults to a starter image"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editProductDesc}
                  onChange={(e) => setEditProductDesc(e.target.value)}
                  placeholder="Describe your delicious homemade product..."
                ></textarea>
              </div>

              {/* Pricing rows */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pricing Sizes *</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditProductPrices([...editProductPrices, { quantity_description: '', price: '' }])}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Size
                  </button>
                </label>
                
                {editProductPrices.map((pr, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={pr.quantity_description}
                      onChange={(e) => {
                        const newPrices = [...editProductPrices]
                        newPrices[idx].quantity_description = e.target.value
                        setEditProductPrices(newPrices)
                      }}
                      placeholder="e.g. 250g Pack"
                      style={{ flex: 2 }}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={pr.price}
                      onChange={(e) => {
                        const newPrices = [...editProductPrices]
                        newPrices[idx].price = e.target.value
                        setEditProductPrices(newPrices)
                      }}
                      placeholder="Price in Rs"
                      style={{ flex: 1 }}
                      min="1"
                      required
                    />
                    {editProductPrices.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          const newPrices = [...editProductPrices]
                          newPrices.splice(idx, 1)
                          setEditProductPrices(newPrices)
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0.5rem' }}
                      >
                        <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Recipe instructions */}
              <div className="form-group">
                <label className="form-label">Serving Recipe instructions</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={editProductRecipe}
                  onChange={(e) => setEditProductRecipe(e.target.value)}
                  placeholder="e.g. Serve hot with steamed rice and melted ghee..."
                ></textarea>
              </div>

              {/* Recipe Ingredients checkbox & quantity values list */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Recipe Ingredients & Composition Number per 1 Unit:</span>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <svg style={{ position: 'absolute', left: '8px', width: '11px', height: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                      type="text"
                      placeholder="Search ingredient..."
                      value={editProductIngSearch}
                      onChange={(e) => setEditProductIngSearch(e.target.value)}
                      style={{
                        width: '150px',
                        padding: '3px 8px 3px 24px',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)'
                      }}
                    />
                  </div>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Define which raw materials are consumed when this product is manufactured.
                </p>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  {ingredients.filter(ing => ing.name.toLowerCase().includes(editProductIngSearch.toLowerCase())).length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0.5rem', textAlign: 'center' }}>
                      No matching ingredients found.
                    </div>
                  ) : (
                    ingredients
                      .filter(ing => ing.name.toLowerCase().includes(editProductIngSearch.toLowerCase()))
                      .map((ing) => {
                        const ratioObj = editProductIngredients[ing.ingredient_id]
                        const ratioVal = ratioObj ? (typeof ratioObj === 'object' ? ratioObj.value : ratioObj) : ''
                        const ratioUnit = ratioObj ? (typeof ratioObj === 'object' ? ratioObj.unit : getDefaultUnit(ing.unit)) : getDefaultUnit(ing.unit)
                        const availableUnits = getAvailableUnits(ing.unit)
                        return (
                          <div key={ing.ingredient_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <input
                              type="checkbox"
                              id={`edit-ing-${ing.ingredient_id}`}
                              checked={ing.ingredient_id in editProductIngredients}
                              onChange={(e) => {
                                const newIngs = { ...editProductIngredients }
                                if (e.target.checked) {
                                  newIngs[ing.ingredient_id] = { value: '', unit: getDefaultUnit(ing.unit) }
                                } else {
                                  delete newIngs[ing.ingredient_id]
                                }
                                setEditProductIngredients(newIngs)
                              }}
                            />
                            <label htmlFor={`edit-ing-${ing.ingredient_id}`} style={{ fontSize: '0.85rem', flexGrow: 1 }}>{ing.name} ({ing.unit})</label>
                            {ing.ingredient_id in editProductIngredients && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  step="1"
                                  className="form-input"
                                  style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                  value={ratioVal}
                                  onChange={(e) => {
                                    setEditProductIngredients({
                                      ...editProductIngredients,
                                      [ing.ingredient_id]: { value: e.target.value, unit: ratioUnit }
                                    })
                                  }}
                                  placeholder="Number"
                                  min="1"
                                  required
                                />
                                <select
                                  className="form-input"
                                  style={{ width: '65px', padding: '0.25rem 0.35rem', fontSize: '0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                                  value={ratioUnit}
                                  onChange={(e) => {
                                    setEditProductIngredients({
                                      ...editProductIngredients,
                                      [ing.ingredient_id]: { value: ratioVal, unit: e.target.value }
                                    })
                                  }}
                                >
                                  {availableUnits.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save Changes & Update Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create New Raw Material Modal */}
      {isCreateIngredientModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateIngredientModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Raw Material</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCreateIngredientModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleCreateIngredientSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="e.g. Cardamom, Tomatoes, Ginger"
                  required
                />
              </div>

              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newIngredientStock}
                    onChange={(e) => setNewIngredientStock(e.target.value)}
                    placeholder="e.g. 50.0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <select
                    className="form-select"
                    value={newIngredientUnit}
                    onChange={(e) => setNewIngredientUnit(e.target.value)}
                    required
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="liters">liters (Liters)</option>
                    <option value="units">units (Count/Pieces)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Save to Raw Materials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Raw Material Modal */}
      {isEditIngredientModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditIngredientModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Raw Material</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditIngredientModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleEditIngredientSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editIngredientName}
                  onChange={(e) => setEditIngredientName(e.target.value)}
                  placeholder="e.g. Cardamom, Tomatoes, Ginger"
                  required
                />
              </div>

              <div className="form-inline-group">
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={editIngredientStock}
                    onChange={(e) => setEditIngredientStock(e.target.value)}
                    placeholder="e.g. 50.0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <select
                    className="form-select"
                    value={editIngredientUnit}
                    onChange={(e) => setEditIngredientUnit(e.target.value)}
                    disabled={editIngredientIsReferenced}
                    required
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="liters">liters (Liters)</option>
                    <option value="units">units (Count/Pieces)</option>
                  </select>
                  {editIngredientIsReferenced && (
                    <p style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Unit of measure cannot be modified because this material is currently used in active product recipes.
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Update Raw Material
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method Selector Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div 
            className="modal-content animate-scale-up" 
            style={{ maxWidth: '450px', width: '90%', padding: '2rem' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: 'none', padding: '0 0 1rem 0' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-title)', margin: 0 }}>Select Payment Method</h3>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowPaymentModal(false)}
                style={{ padding: '0.25rem', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0 0 0' }}>
              <button 
                className="btn btn-secondary" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'left',
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-smooth)'
                }}
                onClick={() => {
                  setShowPaymentModal(false);
                  const isConfirmed = window.confirm("Are you sure you want to place this order using Cash on Delivery?");
                  if (isConfirmed) {
                    handleCheckout('COD');
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'rgba(255, 159, 28, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                  <span style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '1.05rem' }}>Cash on Delivery</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay in cash upon delivery of your items.</span>
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  gap: '6px', 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'left',
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-smooth)'
                }}
                onClick={() => {
                  setShowPaymentModal(false);
                  handleCheckout('Razorpay');
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'rgba(255, 159, 28, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  <span style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '1.05rem' }}>Card / UPI / NetBanking</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure payment checkout powered by Razorpay.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subscription Frequency Selector Modal */}
      {subscriptionProduct && (
        <div className="modal-overlay" onClick={() => setSubscriptionProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subscribe to {subscriptionProduct.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSubscriptionProduct(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Receive fresh batches automatically at your doorstep. Pause or cancel anytime.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => handleSubscriptionSubmit('Weekly')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Deliver Weekly
                </button>
                <button className="btn btn-primary" onClick={() => handleSubscriptionSubmit('Bi-Weekly')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Deliver Bi-Weekly
                </button>
                <button className="btn btn-primary" onClick={() => handleSubscriptionSubmit('Monthly')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Deliver Monthly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Direct Order Form Modal */}
      {orderProduct && orderActivePrice && (
        <div className="modal-overlay" onClick={() => { setOrderProduct(null); setOrderActivePrice(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Place Order - {orderProduct.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => { setOrderProduct(null); setOrderActivePrice(null); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleDirectOrderSubmit} className="modal-body">
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-secondary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17.08 12 22.08"></polygon><polygon points="12 2 21 6.92 12 12 3 6.92 12 2"></polygon></svg>
                Packaging Size: {orderActivePrice.quantity_description} (Rs. {orderActivePrice.price} per unit)
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Ramesh Kumar" 
                  defaultValue={currentUser ? currentUser.name : ''}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone or Email *</label>
                <input 
                  type="text" 
                  name="contact" 
                  className="form-input" 
                  required 
                  placeholder="e.g. +91 98765 43210" 
                  defaultValue={currentUser ? currentUser.email : ''}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Order Quantity (Units) *</label>
                <input type="number" name="quantity" className="form-input" required placeholder="e.g. 5" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address & Instructions</label>
                <textarea 
                  name="message" 
                  className="form-textarea" 
                  rows="3" 
                  placeholder="Enter delivery address, landmarks, and delivery instructions..."
                  defaultValue={(() => {
                    if (!currentUser) return '';
                    const parsedBook = parseAddressBook(currentUser.address);
                    const defaultAddr = parsedBook.find(a => a.isDefault) || parsedBook[0];
                    if (defaultAddr) {
                      return [
                        defaultAddr.flat,
                        defaultAddr.area,
                        `${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}`
                      ].filter(Boolean).join('\n');
                    }
                    return currentUser.address || '';
                  })()}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Place Order (Cash on Delivery)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Batch Detail Action History Drawer (Admin Panel) */}
      {selectedBatchForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedBatchForDetail(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Batch Details & Action History: {selectedBatchForDetail.batch_code}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBatchForDetail(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.75rem' }}>Product Metadata</h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>Product Name: <strong>{selectedBatchForDetail.product_name}</strong></div>
                    <div>Category: <span>{selectedBatchForDetail.category_name}</span></div>
                    <div>Pack Size: <strong>{selectedBatchForDetail.pack_size || 'N/A'}</strong></div>
                    <div>Initial Quantity: <strong>{selectedBatchForDetail.quantity_made} units</strong></div>
                    <div>Remaining Stock: <strong style={{ color: 'var(--accent-primary)' }}>{selectedBatchForDetail.current_stock} units</strong></div>
                  </div>
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.75rem' }}>Timeline Metrics</h3>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>Manufacturing Date: <span>{formatDateDisplay(selectedBatchForDetail.manufacturing_date)}</span></div>
                    <div>Expiry Date: <strong style={{ color: 'var(--accent-danger)' }}>{formatDateDisplay(selectedBatchForDetail.expiry_date)}</strong></div>
                    <div>Remaining Shelf Life: <strong>{selectedBatchForDetail.days_remaining} days left</strong></div>
                    <div>Calculated Status: <span className={`badge ${
                      selectedBatchForDetail.status === 'Active' ? 'badge-success' : 'badge-warning'
                    }`}>{selectedBatchForDetail.status}</span></div>
                  </div>
                </div>
              </div>

              {/* Batch Action Logs */}
              <h3 style={{ marginBottom: '0.5rem' }}>Audit / Action Logs</h3>
              <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Qty Change</th>
                      <th>Description</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBatchForDetail.action_history.map((h) => (
                      <tr key={h.history_id}>
                        <td><span className={`badge ${h.action_type === 'Created' ? 'badge-success' : 'badge-info'}`}>{h.action_type}</span></td>
                        <td><strong style={{ color: h.quantity_changed < 0 ? 'var(--accent-danger)' : 'var(--accent-secondary)' }}>
                          {h.quantity_changed > 0 ? `+${h.quantity_changed}` : h.quantity_changed}
                        </strong></td>
                        <td style={{ fontSize: '0.85rem' }}>{h.description}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Consumption Details */}
              <h3 style={{ marginBottom: '0.5rem' }}>Order Consumption Timeline</h3>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {selectedBatchForDetail.consumption_timeline.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No customer orders filled from this batch yet.</p>
                ) : (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Qty Taken</th>
                        <th>Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatchForDetail.consumption_timeline.map((d, idx) => (
                        <tr key={idx}>
                          <td><strong>#{d.order_id}</strong></td>
                          <td>{d.customer_name}</td>
                          <td><strong>{d.quantity_deducted} units</strong></td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.order_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Refill Raw Ingredient Modal */}
      {refillIngredient && (
        <div className="modal-overlay" onClick={() => setRefillIngredient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Refill Ingredient - {refillIngredient.name}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setRefillIngredient(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}><svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form onSubmit={handleRefillSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Current Stock</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {refillIngredient.stock_quantity} {refillIngredient.unit}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Refill Quantity ({refillIngredient.unit}) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={refillQty}
                  onChange={(e) => setRefillQty(e.target.value)}
                  placeholder="e.g. 50.0"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 10 12 15 7 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line><path d="M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"></path></svg>
                Add to Inventory Stock
              </button>
            </form>
          </div>
        </div>
      )}
 
      {/* 6. Payment Success Modal */}
      {upiPaymentModalDetails && isPaymentReceived && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-up" style={{ maxWidth: '450px', width: '90%', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
              <div className="success-animation-container">
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" />
                  <path className="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.45rem', color: 'var(--accent-secondary)', fontWeight: 700, marginTop: '0.5rem', fontFamily: 'Outfit' }}>
                Payment Received!
              </h3>
              <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                Order <strong>#{upiPaymentModalDetails.order_id}</strong> Placed Successfully!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Redirecting to the home page...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. COD Success Modal */}
      {codSuccessDetails && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-up" style={{ maxWidth: '450px', width: '90%', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 0' }}>
              <div className="success-animation-container">
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" />
                  <path className="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.45rem', color: 'var(--accent-secondary)', fontWeight: 700, marginTop: '0.5rem', fontFamily: 'Outfit' }}>
                Order Confirmed!
              </h3>
              <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                Order <strong>#{codSuccessDetails.order_id}</strong> Placed Successfully!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Redirecting to your orders...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget */}
      {currentUser && (
        <>
          {/* Chatbot Trigger Bubble */}
          <button
            className={`chat-widget-trigger ${isChatOpen ? 'active' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="AI Assistant"
          >
            {isChatOpen ? (
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            )}
          </button>

          {/* Chatbot Window */}
          {isChatOpen && (
            <div className="chat-widget-container animate-slide-up">
              {currentUser.role === 'admin' ? (
                // ==================== ADMIN CHAT WINDOW ====================
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Title Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(30, 41, 59, 0.4)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📋</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Inventory Copilot</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>Active Link</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          if (window.confirm("Clear inventory chat history?")) {
                            setAiMessagesAdmin([
                              {
                                id: 1,
                                sender: 'assistant',
                                text: "Hello Admin! I am your **Sharadha Stores Inventory Copilot**. I can help you check stock levels, view expiring batches, review ingredient stocks, or plan restocking. What inventory queries do you have today? 📋",
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            ]);
                          }
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div
                    id="ai-chat-thread-widget-admin"
                    style={{
                      flex: 1,
                      padding: '1rem',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {aiMessagesAdmin.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            width: '100%',
                            animation: 'fadeIn 0.2s ease-in-out'
                          }}
                        >
                          <div style={{
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start'
                          }}>
                            <div style={{
                              padding: '0.75rem 1rem',
                              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isUser ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                              color: isUser ? '#000000' : 'var(--text-main)',
                              border: isUser ? 'none' : '1px solid var(--border-color)',
                              boxShadow: isUser ? '0 4px 12px rgba(255, 159, 28, 0.2)' : 'none',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              whiteSpace: 'pre-line'
                            }}>
                              {msg.text.split('\n').map((line, lIdx) => {
                                const parts = line.split('**');
                                return (
                                  <div key={lIdx} style={{ minHeight: '1.1em' }}>
                                    {parts.map((part, pIdx) => {
                                      if (pIdx % 2 === 1) {
                                        return <strong key={pIdx} style={{ color: isUser ? '#000' : '#fff', fontWeight: 700 }}>{part}</strong>;
                                      }
                                      const subParts = part.split('_');
                                      return subParts.map((subPart, sIdx) => {
                                        if (sIdx % 2 === 1) {
                                          return <em key={sIdx} style={{ opacity: 0.9 }}>{subPart}</em>;
                                        }
                                        return <span key={sIdx}>{subPart}</span>;
                                      });
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.2rem' }}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {isAiTypingAdmin && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 16px 4px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="dot-pulse"></span>
                          <span>Analyzing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Bar */}
                  <form
                    onSubmit={handleSendAdminAIMessage}
                    style={{
                      padding: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ask copilot..."
                      value={aiInputAdmin}
                      onChange={(e) => setAiInputAdmin(e.target.value)}
                      disabled={isAiTypingAdmin}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isAiTypingAdmin || !aiInputAdmin.trim()}
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#000000',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              ) : (
                // ==================== CLIENT CHAT WINDOW ====================
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Title Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(30, 41, 59, 0.4)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>💬</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Sharadha Stores AI</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>Active Assistant</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          if (window.confirm("Clear chat history?")) {
                            setAiMessagesClient([
                              {
                                id: 1,
                                sender: 'assistant',
                                text: "Hello! I am your **Sharadha Stores Virtual Assistant**. I can help you search for home-cooked foods, check ingredients, tell you about current prices and packaging options, check order details, or give cooking recommendations. How can I help you today? 🍲",
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            ]);
                          }
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div
                    id="ai-chat-thread-widget-client"
                    style={{
                      flex: 1,
                      padding: '1rem',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {aiMessagesClient.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            width: '100%',
                            animation: 'fadeIn 0.2s ease-in-out'
                          }}
                        >
                          <div style={{
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start'
                          }}>
                            <div style={{
                              padding: '0.75rem 1rem',
                              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isUser ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                              color: isUser ? '#000000' : 'var(--text-main)',
                              border: isUser ? 'none' : '1px solid var(--border-color)',
                              boxShadow: isUser ? '0 4px 12px rgba(255, 159, 28, 0.2)' : 'none',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              whiteSpace: 'pre-line'
                            }}>
                              {msg.text.split('\n').map((line, lIdx) => {
                                const parts = line.split('**');
                                return (
                                  <div key={lIdx} style={{ minHeight: '1.1em' }}>
                                    {parts.map((part, pIdx) => {
                                      if (pIdx % 2 === 1) {
                                        return <strong key={pIdx} style={{ color: isUser ? '#000' : '#fff', fontWeight: 700 }}>{part}</strong>;
                                      }
                                      const subParts = part.split('_');
                                      return subParts.map((subPart, sIdx) => {
                                        if (sIdx % 2 === 1) {
                                          return <em key={sIdx} style={{ opacity: 0.9 }}>{subPart}</em>;
                                        }
                                        return <span key={sIdx}>{subPart}</span>;
                                      });
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.2rem' }}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {isAiTypingClient && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: '16px 16px 16px 4px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="dot-pulse"></span>
                          <span>Typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Bar */}
                  <form
                    onSubmit={handleSendClientAIMessage}
                    style={{
                      padding: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ask assistant..."
                      value={aiInputClient}
                      onChange={(e) => setAiInputClient(e.target.value)}
                      disabled={isAiTypingClient}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isAiTypingClient || !aiInputClient.trim()}
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#000000',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}
