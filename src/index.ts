import { Reducer } from "react";
import "ts-array-ext";

/**
 * Different mutating types to be performed in the reducers dispatch.
 */
export enum ListReducerActionType {
  /** Remove one or many item(s) from state */
  Remove,
  /** Replace one or many item(s) from state if present */
  Update,
  /** Append one or many item(s) to state*/
  Add,
  /** Replace or append one or many item(s) of state*/
  AddOrUpdate,
  /** Reset the whole state */
  Reset
}

//The conditional type, specifying the type of data depending on the action type
type ActionDataType<T, K> = K extends ListReducerActionType.Reset
  ? T[]
  : K extends ListReducerActionType.Remove
  ? T[keyof T][] | T[keyof T]
  : T[] | T;

type ListReducerActionInput<T, K extends ListReducerActionType> = {
  type: K;
  data: ActionDataType<T, K>;
};

export type AllListActions<T> =
  | ListReducerActionInput<T, ListReducerActionType.Remove>
  | ListReducerActionInput<T, ListReducerActionType.Update>
  | ListReducerActionInput<T, ListReducerActionType.Add>
  | ListReducerActionInput<T, ListReducerActionType.Reset>
  | ListReducerActionInput<T, ListReducerActionType.AddOrUpdate>;

const isArray = <T>(t: T | T[]): t is Array<T> => {
  return Array.isArray(t);
};

/**
 * @typeparam `T` type of the reducer state
 * @param {keyof T} key value of `U`
 * @return {Reducer} React reducer for a stateful list of `T`
 *
 * Can be initiated like this
 * `ListReducer<Entity>("id")`
 * Where `Entity` is the type of the list and `"id"` is a property key on the type
 * that is to be used to find index in the list
 */
export default <T>(key: keyof T): Reducer<T[], AllListActions<T>> => (
  state: T[],
  action: AllListActions<T>
) => {
  switch (action.type) {
    case ListReducerActionType.AddOrUpdate:
      if (isArray(action.data)) {
        const dataByKey = new Map<T[keyof T], T>();
        action.data.forEach((dat) => {
          dataByKey.set(dat[key], dat);
        });
        const updatedValues = state.map(value => {
          const updatedValue = dataByKey.get(value[key]);
          if(updatedValue){
            dataByKey.delete(value[key]);
            return updatedValue;
          }
          return value;
        });
        return [...updatedValues, ...dataByKey.values()];
      } else {
        const dat = action.data;
        const index = state.findIndex(i => i[key] === dat[key]);

        if (index !== -1) {
          state.findAndReplace(x => x[key] === dat[key], action.data);
          return [...state];
        } else {
          return [...state, dat];
        }
      }
    case ListReducerActionType.Add:
      if (isArray(action.data)) {
        return [...state, ...action.data];
      } else {
        return [...state, action.data];
      }
    case ListReducerActionType.Update: {
      if (isArray(action.data)) {
        action.data.forEach(dat => {
          state.findAndReplace(x => x[key] === dat[key], dat);
        });
      } else {
        const dat = action.data;
        state.findAndReplace(x => x[key] === dat[key], dat);
      }
      return [...state];
    }
    case ListReducerActionType.Remove:
      if (isArray(action.data)) {
        const dat = action.data;
        return state.filter(t => dat.indexOf(t[key]) === -1);
      } else {
        return state.filter(t => t[key] !== action.data);
      }
    case ListReducerActionType.Reset:
      return action.data;
    default:
      return state;
  }
};
