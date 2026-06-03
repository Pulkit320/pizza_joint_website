/**
 * @file        apiService.js
 * @module      ApiService
 * @description Centralized service layer for executing backend API calls.
 * @layer       service
 * @author      Architect Agent
 * @version     1.0.0
 */

/**
 * @function  fetchData
 * @summary   Wrapper around native fetch to perform HTTP requests
 * @param     {string}  urlPath - Endpoint URL subpath
 * @param     {object}  options - Configuration options (headers, method, etc.)
 * @returns   {Promise<object>} Parsed JSON response body
 * @throws    {Error} If the HTTP request fails or response status is non-2xx
 */
async function fetchData(urlPath, options = {}) {
  try {
    const response = await fetch(urlPath, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API service request failed:', error);
    throw error;
  }
}

module.exports = {
  fetchData,
};
