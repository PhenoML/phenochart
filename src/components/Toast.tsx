import { useEffect, useState } from 'react';

interface Props {
  message: string;
  duration?: number;
  onDone: () => void;
}

export function Toast({ message, duration = 3000, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (!cancelled) onDone();
      }, 300);
    }, duration);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed top-3 left-3 right-3 z-50 rounded-lg border border-pheno-accent/30 bg-pheno-accent-light px-4 py-3 font-body text-sm text-pheno-accent shadow-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {message}
    </div>
  );
}
