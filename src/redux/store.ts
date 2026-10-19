import { configureStore } from "@reduxjs/toolkit";
import bookReducer from "./features/bookSlice";

export const makeStore = () =>
  configureStore({
    reducer: { bookSlice: bookReducer },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
