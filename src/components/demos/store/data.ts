// Shared data for the Urban Threads store demo (frontend only).

export const IMG = (id: string, w = 600, h = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`

export type Product = {
  name: string
  price: string
  old?: string
  category: string
  c: string
  img: string
}

export const categories = ['All', 'Tops', 'Outerwear', 'Accessories', 'Footwear']

export const products: Product[] = [
  { name: 'Oversized Cotton Tee', price: '$32', old: '$45', category: 'Tops', c: '#d6d3d1', img: IMG('1521572163474-6864f9cf17ab') },
  { name: 'Classic Crewneck', price: '$54', category: 'Tops', c: '#e7e5e4', img: IMG('1556905055-8f358a7a47b2') },
  { name: 'Linen Button Shirt', price: '$48', category: 'Tops', c: '#e7e5e4', img: IMG('1602810318383-e386cc2a3ccf') },
  { name: 'Ribbed Knit Polo', price: '$42', old: '$58', category: 'Tops', c: '#d4d4d8', img: IMG('1593030103066-0093718efeb9') },
  { name: 'Relaxed Denim Jacket', price: '$89', category: 'Outerwear', c: '#94a3b8', img: IMG('1551537482-f2075a1d41f2') },
  { name: 'Wool Overcoat', price: '$180', category: 'Outerwear', c: '#a8a29e', img: IMG('1539533018447-63fcce2678e3') },
  { name: 'Quilted Puffer', price: '$120', old: '$160', category: 'Outerwear', c: '#a3a3a3', img: IMG('1591047139829-d91aecb6caea') },
  { name: 'Knit Beanie', price: '$18', category: 'Accessories', c: '#a8a29e', img: IMG('1576871337632-b9aef4c17ab9') },
  { name: 'Canvas Tote Bag', price: '$24', old: '$30', category: 'Accessories', c: '#d4d4d8', img: IMG('1544816155-12df9643f363') },
  { name: 'Wool Blend Scarf', price: '$38', category: 'Accessories', c: '#cbd5e1', img: IMG('1520903920243-00d872a2d1c9') },
  { name: 'Everyday Sneakers', price: '$98', category: 'Footwear', c: '#d6d3d1', img: IMG('1542291026-7eec264c27ff') },
  { name: 'Leather Chelsea Boots', price: '$145', old: '$185', category: 'Footwear', c: '#a3a3a3', img: IMG('1608256246200-53e635b5b65f') },
]
