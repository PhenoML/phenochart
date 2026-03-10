import { createContext, useContext } from 'react';
import { useCdsState, type CdsAction } from '../hooks/useCdsState';
import type { CdsState } from '../types/cds';

interface CdsContextValue extends CdsState {
  dispatch: React.Dispatch<CdsAction>;
}

const CdsContext = createContext<CdsContextValue | null>(null);

export function CdsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useCdsState();

  return (
    <CdsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </CdsContext.Provider>
  );
}

export function useCds() {
  const context = useContext(CdsContext);
  if (!context) {
    throw new Error('useCds must be used within CdsProvider');
  }
  return context;
}
