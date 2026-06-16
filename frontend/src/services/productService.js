/**
 * @file        productService.js
 * @module      services
 * @description Centralized service layer for executing product-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Fallback Mock Products Database
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Gourmet Neapolitan Margherita",
    category: "Vegetarian",
    description: "Bubbling buffalo mozzarella, fresh sweet basil leaves, cherry tomatoes, and a drizzle of extra virgin olive oil on our signature charred thin crust.",
    price: 499,
    image: "/pizza_hero.png",
    isPopular: true,
    isProductOfWeek: true,
  },
  {
    id: 2,
    name: "Hot Honey Pepperoni Supreme",
    category: "Meat",
    description: "Generous curls of crispy cup pepperoni, stringy mozzarella, and fresh red pepper flakes finished with a hot chili honey drizzle.",
    price: 599,
    image: "/pizza_week.png",
    isPopular: true,
    isProductOfWeek: false,
  },
  {
    id: 3,
    name: "Truffle Wild Mushroom",
    category: "Vegetarian",
    description: "Creamy white sauce base, sautéed porcini and button mushrooms, fresh thyme, caramelized onions, and premium white truffle oil drizzle.",
    price: 649,
    image: "/pizza_hero.png",
    isPopular: true,
    isProductOfWeek: false,
  },
  {
    id: 4,
    name: "Spicy Peri-Peri Chicken Pizza",
    category: "Meat",
    description: "Flame-grilled peri-peri chicken breast, fire-roasted bell peppers, red onions, and mozzarella, topped with fresh cilantro.",
    price: 549,
    image: "/pizza_week.png",
    isPopular: false,
    isProductOfWeek: false,
  },
  {
    id: 5,
    name: "Garden Veggie & Pesto",
    category: "Vegetarian",
    description: "Artisan basil pesto base, grilled zucchini, artichoke hearts, sun-dried tomatoes, and crumbled feta cheese.",
    price: 529,
    image: "/pizza_hero.png",
    isPopular: false,
    isProductOfWeek: false,
  },
  {
    id: 6,
    name: "Smoked Bacon & Jalapeño BBQ",
    category: "Meat",
    description: "Applewood smoked bacon, pickled jalapeños, sweet red onions, and mozzarella on a tangy hickory BBQ sauce base.",
    price: 589,
    image: "/pizza_week.png",
    isPopular: true,
    isProductOfWeek: false,
  },
  {
    id: 7,
    name: "Classic Garlic Knots",
    category: "Sides",
    description: "Six oven-baked dough knots tossed in extra virgin olive oil, minced garlic, sea salt, parsley, and parmesan, served with marinara.",
    price: 199,
    image: "/pizza_hero.png",
    isPopular: false,
    isProductOfWeek: false,
  },
  {
    id: 8,
    name: "Artisan Tiramisu Cup",
    category: "Desserts",
    description: "House-made classic Italian espresso dessert with ladyfingers, rich mascarpone cream, and cocoa powder dusting.",
    price: 249,
    image: "/pizza_week.png",
    isPopular: true,
    isProductOfWeek: false,
  }
];

/**
 * @function  getProducts
 * @summary   Fetches the complete catalog of products
 * @returns   {Promise<Array>} List of product objects
 * @throws    {object} Formatted error details
 */
export async function getProducts() {
  try {
    const res = await apiService.get('/products');
    return res.data.products;
  } catch (err) {
    console.warn('apiService: getProducts failed, falling back to mock data', err);
    return MOCK_PRODUCTS;
  }
}

/**
 * @function  getProductById
 * @summary   Fetches a specific product by its ID
 * @param     {number} id - Product unique ID
 * @returns   {Promise<object>} The matching product details
 * @throws    {object} Formatted error details
 */
export async function getProductById(id) {
  try {
    const res = await apiService.get(`/products/${id}`);
    return res.data.product;
  } catch (err) {
    console.warn(`apiService: getProductById(${id}) failed, falling back to mock data`, err);
    const product = MOCK_PRODUCTS.find((p) => p.id === Number(id));
    if (!product) {
      throw { code: 'PRODUCT_NOT_FOUND', message: 'The requested product does not exist.' };
    }
    return product;
  }
}

/**
 * @function  getPopularProducts
 * @summary   Fetches popular/highlighted products
 * @returns   {Promise<Array>} Highlighted products list
 * @throws    {object} Formatted error details
 */
export async function getPopularProducts() {
  try {
    const res = await apiService.get('/products/popular');
    return res.data.products;
  } catch (err) {
    console.warn('apiService: getPopularProducts failed, falling back to mock data', err);
    return MOCK_PRODUCTS.filter((p) => p.isPopular);
  }
}

const productService = {
  getProducts,
  getProductById,
  getPopularProducts,
};

export default productService;
