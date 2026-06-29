import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { counterActions, authActions } from '../store/index';

export default function ReduxDemoApp() {
  const dispatch = useDispatch();
  const counter = useSelector((state) => state.counter.counter);
  const showCounter = useSelector((state) => state.counter.showCounter);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(authActions.login());
  };

  const handleLogout = () => {
    dispatch(authActions.logout());
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans antialiased flex flex-col pb-12">
      
      {/* --- Purple Navigation Header --- */}
      <header className="bg-indigo-700 py-4 px-8 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold text-white tracking-wide">Redux Auth</h1>
        
        {isAuthenticated && (
          <nav className="flex items-center space-x-6">
            <a href="#products" className="text-sm font-medium text-slate-100 hover:text-white transition">My Products</a>
            <a href="#sales" className="text-sm font-medium text-slate-100 hover:text-white transition">My Sales</a>
            <button
              onClick={handleLogout}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-5 py-1.5 rounded-lg text-sm transition shadow-sm active:scale-95 cursor-pointer"
            >
              Logout
            </button>
          </nav>
        )}
      </header>

      {/* --- Main Content Area --- */}
      <main className="max-w-md mx-auto w-full px-4 mt-12 flex-1 flex flex-col space-y-6">
        
        {/* --- Authenticated/Unauthenticated conditional card --- */}
        {!isAuthenticated ? (
          /* Login Card */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in">
            <form onSubmit={handleLogin} className="flex flex-col space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder-slate-650"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder-slate-650"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center transition shadow-md shadow-indigo-650/10 active:scale-[0.98] cursor-pointer"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          /* User Profile Card */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-1">My User Profile</h2>
            <p className="text-xs text-slate-400">Welcome back, administrator!</p>
          </div>
        )}

        {/* --- Redux Counter Card (rendered on both screens as per BeforeLogin and AfterLogin mocks) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Redux Counter</h2>
          
          <div className="h-16 flex items-center justify-center">
            {showCounter ? (
              <span className="text-4xl font-extrabold text-white tracking-tight animate-fade-in">
                {counter}
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">Counter Hidden</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => dispatch(counterActions.increment())}
              className="bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/50 hover:border-indigo-700/50 text-indigo-300 font-bold py-2 rounded-xl text-[11px] transition active:scale-95 cursor-pointer"
            >
              Increment
            </button>
            <button
              onClick={() => dispatch(counterActions.increase(10))}
              className="bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/50 hover:border-emerald-700/50 text-emerald-300 font-bold py-2 rounded-xl text-[11px] transition active:scale-95 cursor-pointer"
            >
              Increase by 10
            </button>
            <button
              onClick={() => dispatch(counterActions.decrement())}
              className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold py-2 rounded-xl text-[11px] transition active:scale-95 cursor-pointer"
            >
              Decrement
            </button>
          </div>

          <button
            onClick={() => dispatch(counterActions.toggleCounter())}
            className="w-full bg-slate-800/55 hover:bg-slate-750 border border-slate-750 text-slate-400 hover:text-white font-bold py-2 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
          >
            Toggle Counter
          </button>
        </div>

      </main>
    </div>
  );
}
