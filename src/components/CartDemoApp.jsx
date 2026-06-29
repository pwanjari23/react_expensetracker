import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { cartActions } from '../store/index';

const DUMMY_PRODUCTS = [
  { id: 'p1', price: 6, title: 'Test Item 1', description: 'This is a first product - amazing!' },
  { id: 'p2', price: 8, title: 'Test Item 2', description: 'This is a second product - wonderful!' },
];

export default function CartDemoApp() {
  const dispatch = useDispatch();
  const cartIsVisible = useSelector((state) => state.cart.cartIsVisible);
  const cartItems = useSelector((state) => state.cart.items);

  const totalQuantity = cartItems.reduce((val, item) => val + item.quantity, 0);

  const handleToggleCart = () => {
    dispatch(cartActions.toggle());
  };

  const handleAddProduct = (product) => {
    console.log("Adding product to cart:", product.title);
    dispatch(cartActions.addItem({
      id: product.id,
      title: product.title,
      price: product.price,
    }));
  };

  const handleRemoveProduct = (id) => {
    console.log("Removing product unit from cart (id):", id);
    dispatch(cartActions.removeItem(id));
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 font-sans antialiased flex flex-col pb-12 relative overflow-hidden">
      
      {/* Top Header */}
      <header className="border-b border-indigo-950 bg-slate-950/40 backdrop-blur-md py-4 px-8 flex items-center justify-between sticky top-0 z-50 transition-colors">
        <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
          ReduxCart
        </h1>
        <button
          onClick={handleToggleCart}
          className="flex items-center space-x-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/50 hover:border-emerald-700/50 text-emerald-300 font-bold px-5 py-2 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md shadow-emerald-950/15"
        >
          <span>My Cart</span>
          <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
            {totalQuantity}
          </span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto w-full px-4 mt-12 flex-1 flex flex-col space-y-6">
        
        {/* Conditional Cart Card */}
        {cartIsVisible && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in space-y-4">
            <h2 className="text-sm font-bold text-white tracking-wide border-b border-slate-800 pb-2 flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
              Your Shopping Cart
            </h2>

            {cartItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Your cart is empty.</p>
            ) : (
              <div className="divide-y divide-slate-850">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between text-xs animate-fade-in">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{item.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        x{item.quantity} • ${item.price.toFixed(2)}/item
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-white">${item.totalPrice.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleRemoveProduct(item.id)}
                          className="w-7 h-7 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer text-sm"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleAddProduct(item)}
                          className="w-7 h-7 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products List Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wide border-b border-slate-800 pb-2 flex items-center">
            <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
            Buy Your Favorite Products
          </h2>
          
          <div className="divide-y divide-slate-850">
            {DUMMY_PRODUCTS.map((prod) => (
              <div key={prod.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200">{prod.title}</span>
                    <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-900/50">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{prod.description}</p>
                </div>
                <button
                  onClick={() => handleAddProduct(prod)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10 flex-shrink-0"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
