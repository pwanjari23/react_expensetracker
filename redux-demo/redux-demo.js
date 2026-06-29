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

// Deliverable Part 1: Dispatch increment action 5 times
console.log("--- Dispatching 'increment' 5 times ---");
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });
store.dispatch({ type: 'increment' });

// Deliverable Part 2: Dispatch decrement action
console.log("--- Dispatching 'decrement' ---");
store.dispatch({ type: 'decrement' });
