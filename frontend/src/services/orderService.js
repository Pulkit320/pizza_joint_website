/**
 * @file        orderService.js
 * @module      services
 * @description Centralized service layer for executing order-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Initialize mock orders in localStorage
const DEFAULT_ORDERS = [
  {
    id: 5001,
    customerId: 101,
    customerName: "John Doe",
    items: [
      { id: 1, name: "Gourmet Neapolitan Margherita", price: 499, quantity: 2, size: "Medium" },
      { id: 7, name: "Classic Garlic Knots", price: 199, quantity: 1, size: "Standard" }
    ],
    subtotal: 1197,
    pointsRedeemed: 0,
    loyaltyDiscount: 0,
    total: 1197,
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    employeeId: 201, // Chef Marco
    employeeName: "Marco",
    employeePhoto: "/employee_week.png",
    elapsedMinutes: 45
  },
  {
    id: 5002,
    customerId: 101,
    customerName: "John Doe",
    items: [
      { id: 2, name: "Hot Honey Pepperoni Supreme", price: 599, quantity: 1, size: "Large" }
    ],
    subtotal: 599,
    pointsRedeemed: 100,
    loyaltyDiscount: 10,
    total: 589,
    status: "completed",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    employeeId: 202, // Delivery Driver Sarah
    employeeName: "Sarah Jennings",
    employeePhoto: "/employee_week.png",
    elapsedMinutes: 35
  },
  {
    id: 5003,
    customerId: 101,
    customerName: "John Doe",
    items: [
      { id: 3, name: "Truffle Wild Mushroom", price: 649, quantity: 1, size: "Medium" }
    ],
    subtotal: 649,
    pointsRedeemed: 0,
    loyaltyDiscount: 0,
    total: 649,
    status: "prep",
    createdAt: new Date().toISOString(), // Just placed
    employeeId: 201,
    employeeName: "Marco",
    employeePhoto: "/employee_week.png",
    elapsedMinutes: 2
  }
];

if (!localStorage.getItem('mock_orders')) {
  localStorage.setItem('mock_orders', JSON.stringify(DEFAULT_ORDERS));
}

/**
 * @function  createOrder
 * @summary   Places a new pizza order
 * @param     {object} orderData - Core order values (items, loyaltyPointsToRedeem, total)
 * @returns   {Promise<object>} Created order record
 * @throws    {object} Formatted error details
 */
export async function createOrder(orderData) {
  try {
    const res = await apiService.post('/orders', orderData);
    return res.data.order;
  } catch (err) {
    console.warn('apiService: createOrder failed, placing order in mock database', err);
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    
    const newOrder = {
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 5001,
      customerId: 101, // Logged in customer mock ID
      customerName: "John Doe",
      items: orderData.items,
      subtotal: orderData.subtotal,
      pointsRedeemed: orderData.pointsRedeemed || 0,
      loyaltyDiscount: orderData.loyaltyDiscount || 0,
      total: orderData.total,
      status: "received",
      createdAt: new Date().toISOString(),
      employeeId: 201, // Default assign Marco
      employeeName: "Marco",
      employeePhoto: "/employee_week.png",
      elapsedMinutes: 0
    };

    orders.unshift(newOrder); // Add to beginning
    localStorage.setItem('mock_orders', JSON.stringify(orders));

    // Subtract loyalty points if redeemed, and add earned points (10% of total)
    const mockAccount = JSON.parse(localStorage.getItem('mock_loyalty') || '{}');
    if (mockAccount.pointsBalance !== undefined) {
      mockAccount.pointsBalance = Math.max(0, mockAccount.pointsBalance - newOrder.pointsRedeemed);
      const earned = Math.floor(newOrder.total * 0.1);
      mockAccount.pointsBalance += earned;
      
      // Add to ledger
      const ledger = JSON.parse(localStorage.getItem('mock_loyalty_ledger') || '[]');
      if (newOrder.pointsRedeemed > 0) {
        ledger.unshift({
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          eventType: 'Redemption',
          pointsDelta: -newOrder.pointsRedeemed,
          balanceAfter: mockAccount.pointsBalance - earned // ledger snapshot before addition
        });
      }
      ledger.unshift({
        id: Date.now() + 1,
        date: new Date().toISOString().split('T')[0],
        eventType: 'Earned (Order)',
        pointsDelta: earned,
        balanceAfter: mockAccount.pointsBalance
      });
      
      localStorage.setItem('mock_loyalty', JSON.stringify(mockAccount));
      localStorage.setItem('mock_loyalty_ledger', JSON.stringify(ledger));
    }

    return newOrder;
  }
}

/**
 * @function  getOrderById
 * @summary   Fetches tracking/details for a specific order
 * @param     {number} id - Order unique identifier
 * @returns   {Promise<object>} The matching order record
 * @throws    {object} Formatted error details
 */
export async function getOrderById(id) {
  try {
    const res = await apiService.get(`/orders/${id}`);
    return res.data.order;
  } catch (err) {
    console.warn(`apiService: getOrderById(${id}) failed, fetching from mock database`, err);
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const order = orders.find(o => o.id === Number(id));
    if (!order) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Order could not be found.' };
    }
    
    // Update elapsed time for simulation
    const diffMs = Date.now() - new Date(order.createdAt).getTime();
    const elapsedMinutes = Math.floor(diffMs / 60000);
    order.elapsedMinutes = elapsedMinutes;
    
    // Auto-advance status for pending orders in mockup mode
    if (order.status !== 'completed' && order.status !== 'cancelled') {
      if (elapsedMinutes > 15) {
        order.status = 'completed';
      } else if (elapsedMinutes > 10) {
        order.status = 'delivery';
      } else if (elapsedMinutes > 5) {
        order.status = 'oven';
      } else if (elapsedMinutes > 2) {
        order.status = 'prep';
      }
    }

    return order;
  }
}

/**
 * @function  getOrderHistory
 * @summary   Fetches a paginated history of customer orders
 * @param     {number} page - Page offset number
 * @param     {number} limit - Number of records to return per page
 * @returns   {Promise<object>} Object containing orders list and total count
 * @throws    {object} Formatted error details
 */
export async function getOrderHistory(page = 1, limit = 5) {
  try {
    const res = await apiService.get('/orders/history', { params: { page, limit } });
    return res.data;
  } catch (err) {
    console.warn('apiService: getOrderHistory failed, fetching from mock database', err);
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    
    // Filter for customer 101 only
    const customerOrders = orders.filter(o => o.customerId === 101);
    const startIndex = (page - 1) * limit;
    const paginatedOrders = customerOrders.slice(startIndex, startIndex + limit);
    
    return {
      orders: paginatedOrders,
      totalCount: customerOrders.length,
      totalPages: Math.ceil(customerOrders.length / limit),
      currentPage: page
    };
  }
}

/**
 * @function  updateOrderStatus
 * @summary   Updates an order's status inline (Admin only)
 * @param     {number} id - Order unique identifier
 * @param     {string} status - Target status string
 * @returns   {Promise<object>} The updated order object
 * @throws    {object} Formatted error details
 */
export async function updateOrderStatus(id, status) {
  try {
    const res = await apiService.put(`/orders/${id}/status`, { status });
    return res.data.order;
  } catch (err) {
    console.warn(`apiService: updateOrderStatus(${id}, ${status}) failed, updating mock database`, err);
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const orderIdx = orders.findIndex(o => o.id === Number(id));
    
    if (orderIdx === -1) {
      throw { code: 'ORDER_NOT_FOUND', message: 'Order could not be found.' };
    }

    orders[orderIdx].status = status;
    localStorage.setItem('mock_orders', JSON.stringify(orders));
    return orders[orderIdx];
  }
}

const orderService = {
  createOrder,
  getOrderById,
  getOrderHistory,
  updateOrderStatus,
};

export default orderService;
