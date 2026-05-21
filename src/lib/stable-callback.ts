// 稳定回调：拿到的引用一直不变，但每次调用时使用最新的 closure 数据
// 等同于 React RFC useEffectEvent / useEvent 模式
import { useRef, useCallback } from 'react';

export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  // 这个返回的函数引用永远不变；调用时走 ref.current（最新闭包）
  return useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}
