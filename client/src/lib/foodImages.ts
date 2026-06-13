// Product image lookup by name

const FOOD_IMAGES: Record<string, string> = {
  'Pesto Eggs on Toast': '/foods/pesto-eggs-toast.jpg',
  'Eggs Kejriwal': '/foods/eggs-kejriwal.jpg',
  'Miso Scrambled Eggs': '/foods/miso-scrambled-eggs.jpg',
  'Khao Soi Eggs Benedict': '/foods/khao-soi-benedict.jpg',
  'Akuri Style Bhurji': '/foods/akuri-bhurji.jpg',
  'Big Brekkie': '/foods/big-brekkie.jpg',
  'Beetroot Avocado Toast': '/foods/beetroot-avocado-toast.jpg',
  'Skillet Croque Monsieur': '/foods/croque-monsieur.jpg',
  'Veg Ragout & Herb Labneh': '/foods/veg-ragout-labneh.jpg',
  'Tropical Smoothie Bowl': '/foods/tropical-smoothie.jpg',
  'Cocoa Raspberry Smoothie Bowl': '/foods/cocoa-raspberry-smoothie.jpg',
  'Granola Bowl': '/foods/granola-bowl.jpg',
  'Honey Butter French Toast': '/foods/honey-french-toast.jpg',
  'Ricotta Pancakes': '/foods/ricotta-pancakes.jpg',
};

export function getFoodImage(name: string, imageUrl?: string | null): string {
  if (imageUrl) return imageUrl;
  return FOOD_IMAGES[name] ?? '/foods/pesto-eggs-toast.jpg';
}
