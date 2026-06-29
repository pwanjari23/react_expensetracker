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

const store = createStore(counterReducer);

export default store;
