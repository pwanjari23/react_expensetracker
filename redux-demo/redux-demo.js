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
  if (action.type === 'INCREMENTBY2') {
    return {
      counter: state.counter + 2,
    };
  }
  if (action.type === 'DECREMENTBY2') {
    return {
      counter: state.counter - 2,
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

// Dispatch INCREMENTBY2 action
console.log("--- Dispatching 'INCREMENTBY2' ---");
store.dispatch({ type: 'INCREMENTBY2' });

// Dispatch DECREMENTBY2 action
console.log("--- Dispatching 'DECREMENTBY2' ---");
store.dispatch({ type: 'DECREMENTBY2' });
