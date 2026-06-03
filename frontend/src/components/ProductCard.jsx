/**
 * @file        ProductCard.jsx
 * @module      ProductCard
 * @description A reusable UI card to display a pizza product.
 * @layer       controller
 * @author      Architect Agent
 * @version     1.0.0
 */

import React from 'react';

/**
 * @function  ProductCard
 * @summary   Component for rendering a single product item card
 * @param     {object}  props            - React component properties
 * @param     {object}  props.product    - The product item data
 * @param     {string}  props.product.name  - The product name
 * @param     {number}  props.product.price - The product price
 * @returns   {React.ReactElement} The rendered React component markup
 * @throws    {Error} If the product prop is missing or invalid
 */
function ProductCard({ product }) {
  if (!product) {
    throw new Error('ProductCard requires a product object prop');
  }

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>Price: ₹{product.price}</p>
      <button type="button">Add to Cart</button>
    </div>
  );
}

export default ProductCard;
