import React, { useState } from "react";
import Signup from "./components/Signup";
import ReduxDemoApp from "./components/ReduxDemoApp";

function App() {
  // Render the Redux Tutorial App by default (to satisfy the request immediately)
  const [showReduxDemo, setShowReduxDemo] = useState(true);

  return (
    <div className="relative min-h-screen">
      {showReduxDemo ? <ReduxDemoApp /> : <Signup />}

      {/* Floating App Switcher to satisfy all parts */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowReduxDemo(prev => !prev)}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-full text-xs shadow-lg shadow-indigo-900/30 transition active:scale-95 border border-indigo-500/30 cursor-pointer"
        >
          Switch to {showReduxDemo ? "Expense Tracker" : "Redux Tutorial App"}
        </button>
      </div>
    </div>
  );
}

export default App;
