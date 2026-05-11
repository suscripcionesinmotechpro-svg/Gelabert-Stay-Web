import { useServiceCartContext } from '../context/ServiceCartContext';
export type { CartService } from '../context/ServiceCartContext';

export const useServiceCart = () => {
  return useServiceCartContext();
};
