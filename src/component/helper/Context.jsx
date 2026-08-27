'use client'
import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";
import { STORE_NAME } from "@/lib/secret";
import toast from 'react-hot-toast'
import { formatCurrency as formatCurrencyHelper, getCurrencySymbol, getCurrencyCode } from "@/lib/currency";

export const Context = createContext()

const ContextProvider = ({ children }) => {
    const pathname = usePathname()

    const [categories, setCategories] = useState([])
    const [staff, setStaff] = useState(null)
    const [user, setUserState] = useState(null)
    const [loading, setLoading] = useState(true)

    const [cart, setCart] = useState({ items: [] })
    const [cartInitialized, setCartInitialized] = useState(false)

    const updateStaffState = (staffData) => {
        setStaff(staffData);
        setUserState(staffData);
    }

    useEffect(() => {
        const saved = localStorage.getItem("ecom_cart")
        if (saved) {
            try {
                setCart(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e)
            }
        }
        setCartInitialized(true)
    }, [])

    useEffect(() => {
        if (cartInitialized) {
            localStorage.setItem("ecom_cart", JSON.stringify(cart))
        }
    }, [cart, cartInitialized])

    const addToCart = (product, variant = null, qty = 1) => {
        const items = [...cart.items]
        const variantName = variant ? variant.variant_name : null
        const variantId = variant ? variant.variant_id : null
        const existingIdx = items.findIndex(item => 
            item.product_id === product.product_id && 
            item.variant === variantName
        )

        const maxStock = variant ? parseInt(variant.stock, 10) : parseInt(product.stock, 10) || 0
        const currentQty = existingIdx > -1 ? items[existingIdx].quantity : 0
        const newQty = currentQty + qty

        if (newQty > maxStock) {
            toast.error(`Cannot add more than ${maxStock} items to cart`)
            return
        }

        if (existingIdx > -1) {
            items[existingIdx].quantity = newQty
        } else {
            items.push({
                product_id: product.product_id,
                name: product.name,
                image: (variant && variant.image) ? variant.image : (product.image || '/product.jpeg'),
                sale_price: variant ? parseFloat(variant.sale_price) : parseFloat(product.sale_price),
                discount_price: variant ? parseFloat(variant.discount_price || 0) : parseFloat(product.discount_price || 0),
                variant: variantName,
                variant_id: variantId,
                quantity: qty,
                slug: product.slug,
                max_stock: maxStock
            })
        }

        setCart({ items })
        toast.success(`${product.name} added to cart!`)
        setCartbar(true)
    }

    const increaseCartQty = (productId, variantName = null) => {
        setCart(prev => {
            const items = [...prev.items]
            const idx = items.findIndex(item => item.product_id === productId && item.variant === variantName)
            if (idx > -1) {
                const item = items[idx]
                if (item.quantity >= item.max_stock) {
                    toast.error(`Cannot add more than ${item.max_stock} items to cart`)
                    return prev
                }
                item.quantity += 1
            }
            return { items }
        })
    }

    const decreaseCartQty = (productId, variantName = null) => {
        setCart(prev => {
            const items = prev.items.map(item => {
                if (item.product_id === productId && item.variant === variantName) {
                    return { ...item, quantity: item.quantity - 1 }
                }
                return item
            }).filter(item => item.quantity > 0)
            return { items }
        })
    }

    const removeFromCart = (productId, variantName = null) => {
        setCart(prev => {
            const items = prev.items.filter(item => 
                !(item.product_id === productId && item.variant === variantName)
            )
            return { items }
        })
        toast.success("Item removed from cart")
    }

    const clearCart = () => {
        setCart({ items: [] })
    }

    const [cartbar, setCartbar] = useState(false)
    const [userSidebar, setUserSidebar] = useState(false)
    const [dashSidebar, setDashSidebar] = useState(false)
    const [website, setWebsite] = useState(null)
    const [activeCurrency, setActiveCurrency] = useState({ symbol: '৳', code: 'BDT' })

    const fetchActiveCurrency = async () => {
        try {
            const res = await axios.get('/api/currencies?active=true');
            if (res.data && res.data.symbol) {
                setActiveCurrency(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch active currency:", error);
        }
    };

    const fetchWebsite = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (res.data) {
                setWebsite(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch website settings:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/category');
            if (res.data && Array.isArray(res.data)) {
                const parents = res.data.filter(c => c.parent_id === null);
                const nested = parents.map(parent => {
                    const children = res.data.filter(c => c.parent_id === parent.category_id);
                    return {
                        id: parent.category_id,
                        category: parent.name,
                        slug: parent.slug,
                        image: parent.image,
                        subcategory: children.map(child => ({
                            id: child.category_id,
                            name: child.name,
                            slug: child.slug,
                            image: child.image
                        }))
                    };
                });
                setCategories(nested);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await axios.get('/api/staff');
            const activeStaff = response.data?.staff || response.data?.user || null;
            updateStaffState(activeStaff);
        } catch (error) {
            console.error("Failed to fetch staff session:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchWebsite();
        fetchCategories();
        fetchActiveCurrency();
    }, []);

    useEffect(() => {
        const segments = pathname.split('/').filter(Boolean)
        let pageTitle = ''

        if (segments.length === 0) {
            pageTitle = STORE_NAME
        } else {
            const lastSegment = segments[segments.length - 1]
            const formatted = lastSegment
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase())
            pageTitle = `${formatted} | ${STORE_NAME}`
        }

        document.title = pageTitle
    }, [pathname])

    const logout = async () => {
        try {
            await axios.post('/api/staff/logout');
            updateStaffState(null);
            window.location.replace('/');
        } catch (error) {
            console.error("Logout failed:", error);
            try {
                await axios.post('/api/user/logout');
            } catch (e) {
                // Ignore fallback error
            }
            updateStaffState(null);
            window.location.replace('/');
        }
    };

    const currencySymbol = activeCurrency?.symbol || '৳';
    const currencyCode = activeCurrency?.code || 'BDT';
    const formatCurrency = (val) => formatCurrencyHelper(val, currencySymbol);

    const contextValue = {
        categories, cart, setCart,
        addToCart, increaseCartQty, decreaseCartQty, removeFromCart, clearCart,
        cartbar, setCartbar, userSidebar, setUserSidebar, dashSidebar, setDashSidebar,
        staff, setStaff: updateStaffState,
        user: staff, setUser: updateStaffState,
        loading, logout,
        website, fetchWebsite,
        activeCurrency, fetchActiveCurrency,
        currencySymbol, currencyCode, formatCurrency
    }
    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    )
}

export default ContextProvider