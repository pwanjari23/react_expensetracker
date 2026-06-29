import React, { useState } from "react";
import Signup from "./components/Signup";
import ReduxDemoApp from "./components/ReduxDemoApp";
import CartDemoApp from "./components/CartDemoApp";

function App() {
  // Render the Cart Demo App by default (to satisfy the request immediately)
  const [appMode, setAppMode] = useState("cart");

  return (
    <div className="relative min-h-screen">
      {appMode === "cart" && <CartDemoApp />}
      {appMode === "redux" && <ReduxDemoApp />}
      {appMode === "expense" && <Signup />}

      {/* Floating App Switcher to satisfy all parts */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-full shadow-lg backdrop-blur-md">
        <button
          onClick={() => setAppMode("cart")}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            appMode === "cart" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Cart Demo
        </button>
        <button
          onClick={() => setAppMode("redux")}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            appMode === "redux" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Redux Demo
        </button>
        <button
          onClick={() => setAppMode("expense")}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            appMode === "expense" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Expense Tracker
        </button>
      </div>
    </div>
  );
}

export default App;
