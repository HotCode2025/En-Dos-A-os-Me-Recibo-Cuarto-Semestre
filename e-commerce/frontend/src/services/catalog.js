import { apiRequest } from './api'

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.nombre,
    description: row.descripcion || '',
    brand: row.marca || '',
    brandId: row.id_marca,
    category: row.categoria || '',
    categoryId: row.id_categoria,
    price: Number(row.precio),
    rating: Number(row.puntuacion_promedio || 0).toFixed(1),
    reviews: Number(row.cantidad_valoraciones || 0),
    badge: row.es_destacado ? 'Destacado' : Number(row.stock) <= 0 ? 'Sin stock' : '',
    featured: Boolean(row.es_destacado),
    stock: Number(row.stock || 0),
    image: row.imagen_url || '',
    imageAlt: row.nombre,
  }
}

// Último catálogo recibido: permite mostrar productos al instante mientras el backend
// (que en Render puede estar despertando) responde. Si el storage falla, se ignora.
const PRODUCTS_CACHE_KEY = 'puntozero:catalogo'

function getCachedProducts() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(PRODUCTS_CACHE_KEY))
    return Array.isArray(cached) ? cached.map(normalizeProduct) : null
  } catch {
    return null
  }
}

async function getProducts() {
  const rows = await apiRequest('/productos')
  if (!Array.isArray(rows)) {
    throw new Error('El catálogo recibido del servidor no tiene el formato esperado.')
  }
  try {
    sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(rows))
  } catch {
    // Sin storage disponible el catálogo funciona igual, solo sin caché.
  }
  return rows.map(normalizeProduct)
}

async function getProductOptions() {
  const options = await apiRequest('/productos/opciones')
  if (!Array.isArray(options.marcas) || !Array.isArray(options.categorias)) {
    throw new Error('Marcas y categorías recibidas del servidor no tienen el formato esperado.')
  }
  return options
}

export { getProducts, getCachedProducts, getProductOptions, normalizeProduct }
