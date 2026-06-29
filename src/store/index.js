import { createStore } from 'redux';

const initialState = { counter: 0 };

const counterReducer = (state = initialState, action) => {
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
  if (action.type === 'incrementby5' || action.type === 'INCREMENTBY5') {
    return {
      counter: state.counter + 5,
    };
  }
  if (action.type === 'decrementby5' || action.type === 'DECREMENTBY5') {
    return {
      counter: state.counter - 5,
    };
  }
  return state;
};

const store = createStore(counterReducer);

export default store;
