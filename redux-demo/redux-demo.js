const redux = require('redux');

// Reducer function
const counterReducer = (state = { counter: 0 }, action) => {
  if (action.type === 'increment') {
    return {
      counter: state.counter + 1,
    };
  }
  if (action.type === 'decrement') {
    return {
      counter: state.counter - 1,
    };
  }
  if (action.type === 'increase') {
    return {
      counter: state.counter + action.amount,
    };
  }
  if (action.type === 'decrease') {
    return {
      counter: state.counter - action.amount,
    };
  }
  return state;
};

// Create store
const store = redux.createStore(counterReducer);

// Subscriber function
const counterSubscriber = () => {
  const latestState = store.getState();
  console.log(latestState);
};

// Subscribe to store
store.subscribe(counterSubscriber);

// Dispatch increment action 5 times
console.log("--- Dispatching 'increment' 5 times ---");
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });

// Dispatch decrement action
console.log("--- Dispatching 'decrement' ---");
store.dispatch({ type: 'decrement' });

// Dispatch increase by 2 (optimized way)
console.log("--- Dispatching 'increase' with payload 2 ---");
store.dispatch({ type: 'increase', amount: 2 });

// Dispatch decrease by 2 (optimized way)
console.log("--- Dispatching 'decrease' with payload 2 ---");
store.dispatch({ type: 'decrease', amount: 2 });
