import { useState, useEffect, type CSSProperties } from 'react';
import { getFoodImage, getFoodImageFallback } from '../lib/foodImages';

interface FoodCardProps {
  name: string;
  description?: string;
  price: number;
  tax: number;
  imageUrl?: string | null;
  accent?: string;
  vegetarian?: boolean;
  badges?: string[];
  categoryName?: string | null;
  disabled?: boolean;
  onAdd?: () => void;
}

export default function FoodCard({
  name, description, price, tax, imageUrl, accent = '#9E4B3A',
  vegetarian, badges, disabled, onAdd, categoryName,
}: FoodCardProps) {
  const [added, setAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => getFoodImage(name, imageUrl, categoryName));
  const img = imgSrc;

  useEffect(() => {
    setImgSrc(getFoodImage(name, imageUrl, categoryName));
  }, [name, imageUrl, categoryName]);

  function handleImgError() {
    setImgSrc(getFoodImageFallback(name, categoryName));
  }

  function handleClick() {
    if (disabled || !onAdd) return;
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
        <img src={img} alt={name} loading="lazy" onError={handleImgError} />
        {vegetarian && <span className="veg-badge" title="Vegetarian">🌿</span>}
        {badges && badges.length > 0 && (
          <span className="food-badges">{badges.join(' ')}</span>
        )}
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
