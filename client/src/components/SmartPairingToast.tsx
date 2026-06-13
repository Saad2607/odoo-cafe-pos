import { useEffect, useState } from 'react';
import { getFoodImage } from '../lib/foodImages';
import { Product } from '../lib/api';
import '../styles/smart-pairing.css';

const PAIRINGS: Record<string, string[]> = {
  savoury: ['Tropical Smoothie Bowl', 'Honey Butter French Toast', 'Ricotta Pancakes', 'Granola Bowl'],
  sweet: ['Pesto Eggs on Toast', 'Eggs Kejriwal', 'Big Brekkie', 'Miso Scrambled Eggs'],
};

interface SmartPairingToastProps {
  product: Product | null;
  allProducts: Product[];
  onAdd: (p: Product) => void;
  onDismiss: () => void;
}

export default function SmartPairingToast({ product, allProducts, onAdd, onDismiss }: SmartPairingToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (product) {
      setVisible(true);
      const timer = setTimeout(onDismiss, 6000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [product, onDismiss]);

  if (!product || !visible) return null;

  const catKey = product.category?.name.toLowerCase().includes('sweet') ? 'sweet' : 'savoury';
  const suggestions = PAIRINGS[catKey]
    .map((name) => allProducts.find((p) => p.name === name))
    .filter((p): p is Product => !!p && p.id !== product.id)
    .slice(0, 2);

  if (!suggestions.length) return null;

  return (
    <div className="smart-pairing-toast">
      <button type="button" className="smart-pairing-close" onClick={onDismiss}>×</button>
      <p className="smart-pairing-title">✨ Chef&apos;s Pairing</p>
      <p className="smart-pairing-sub">Goes great with <strong>{product.name}</strong></p>
      <div className="smart-pairing-cards">
        {suggestions.map((s) => (
          <button key={s.id} type="button" className="smart-pairing-card" onClick={() => { onAdd(s); onDismiss(); }}>
            <img src={getFoodImage(s.name, s.imageUrl)} alt="" />
            <span>{s.name}</span>
            <strong>+ ₹{s.price}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
