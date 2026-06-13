import { useState, type CSSProperties } from 'react';
import { getFoodImage } from '../lib/foodImages';

interface FoodCardProps {
  name: string;
  description?: string;
  price: number;
  tax: number;
  imageUrl?: string | null;
  accent?: string;
  vegetarian?: boolean;
  disabled?: boolean;
  onAdd: () => void;
}

export default function FoodCard({
  name, description, price, tax, imageUrl, accent = '#9E4B3A',
  vegetarian, disabled, onAdd,
}: FoodCardProps) {
  const [added, setAdded] = useState(false);
  const img = getFoodImage(name, imageUrl);

  function handleClick() {
    if (disabled) return;
    setAdded(true);
    onAdd();
    setTimeout(() => setAdded(false), 600);
  }

  return (
    <button
      type="button"
      className={`menu-food-card${added ? ' menu-food-card-added' : ''}${disabled ? ' menu-food-card-disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      style={{ '--accent': accent } as CSSProperties}
    >
      <div className="menu-food-photo">
        <img src={img} alt={name} loading="lazy" />
        {vegetarian && <span className="veg-badge" title="Vegetarian">🌿</span>}
      </div>
      <div className="menu-food-info">
        <h4>{name}</h4>
        {description && <p>{description}</p>}
        <div className="menu-food-footer">
          <span className="menu-food-price">₹{price}</span>
          <span className="menu-food-tax">+{tax}% tax</span>
        </div>
      </div>
    </button>
  );
}
