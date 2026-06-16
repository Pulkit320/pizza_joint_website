/**
 * @file        employeeService.js
 * @module      services
 * @description Centralized service layer for executing employee-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Initialize mock employees database
const MOCK_EMPLOYEES = [
  {
    id: 201,
    name: "Marco Silva",
    role: "Head Pizzaiolo",
    score: 4.9,
    photo: "/employee_week.png",
    bio: "With over 12 years of experience crafting authentic Neapolitan crusts, Marco leads our kitchen team with passion and precision. Known for his signature tomato sauce recipe.",
    isEmployeeOfWeek: true,
    ratingsCount: 42,
    praiseTags: {
      "Friendly": 18,
      "Fast": 15,
      "Professional": 25,
      "Went above and beyond": 12,
      "Great communicator": 9
    },
    ratingsFeed: [
      { id: 1, customerName: "Alice S.", rating: 5, comment: "Marco makes the best crust in town! Extremely friendly when greeting us at the counter.", date: "2026-06-02" },
      { id: 2, customerName: "Robert D.", rating: 5, comment: "Professional service and our crust was perfectly charred. Master of the oven!", date: "2026-05-30" },
      { id: 3, customerName: "Claire M.", rating: 4, comment: "Very fast prep, though toppings could be spread a tiny bit more evenly. Still delicious!", date: "2026-05-25" }
    ]
  },
  {
    id: 202,
    name: "Sarah Jennings",
    role: "Delivery Ambassador",
    score: 4.7,
    photo: "/employee_week.png",
    bio: "Sarah ensures your food arrives piping hot. She knows every shortcut in the neighborhood and is frequently praised for her bright smile at the door.",
    isEmployeeOfWeek: false,
    ratingsCount: 30,
    praiseTags: {
      "Friendly": 22,
      "Fast": 20,
      "Professional": 14,
      "Went above and beyond": 8,
      "Great communicator": 18
    },
    ratingsFeed: [
      { id: 1, customerName: "John Doe", rating: 5, comment: "Fast and extremely polite! Food was still sizzling.", date: "2026-06-01" },
      { id: 2, customerName: "Ken L.", rating: 4, comment: "Great communication, texted me when she was 2 mins away.", date: "2026-05-28" }
    ]
  },
  {
    id: 203,
    name: "Dave Miller",
    role: "Sous Pizzaiolo",
    score: 4.6,
    photo: "/employee_week.png",
    bio: "Dave keeps the kitchen running smoothly during peak rushes. A perfectionist when it comes to cheese melting and ingredient ratios.",
    isEmployeeOfWeek: false,
    ratingsCount: 24,
    praiseTags: {
      "Friendly": 10,
      "Fast": 18,
      "Professional": 12,
      "Went above and beyond": 5,
      "Great communicator": 4
    },
    ratingsFeed: [
      { id: 1, customerName: "Sam T.", rating: 5, comment: "Speedy preparation! The pepperoni was cooked perfectly.", date: "2026-05-29" }
    ]
  }
];

if (!localStorage.getItem('mock_employees')) {
  localStorage.setItem('mock_employees', JSON.stringify(MOCK_EMPLOYEES));
}

/**
 * @function  getEmployeeOfWeek
 * @summary   Fetches the current Employee of the Week details
 * @returns   {Promise<object>} Employee profile details
 * @throws    {object} Formatted error details
 */
export async function getEmployeeOfWeek() {
  try {
    const res = await apiService.get('/employees/week');
    return res.data.employee;
  } catch (err) {
    console.warn('apiService: getEmployeeOfWeek failed, returning mock employee of the week', err);
    const employees = JSON.parse(localStorage.getItem('mock_employees') || '[]');
    const eotw = employees.find(e => e.isEmployeeOfWeek);
    return eotw || employees[0];
  }
}

/**
 * @function  getEmployeeById
 * @summary   Fetches individual profile and scorecard ratings (Admin only)
 * @param     {number} id - Employee unique identifier
 * @returns   {Promise<object>} The matching employee detail scorecard
 * @throws    {object} Formatted error details
 */
export async function getEmployeeById(id) {
  try {
    const res = await apiService.get(`/employees/${id}`);
    return res.data.employee;
  } catch (err) {
    console.warn(`apiService: getEmployeeById(${id}) failed, returning mock details`, err);
    const employees = JSON.parse(localStorage.getItem('mock_employees') || '[]');
    const employee = employees.find(e => e.id === Number(id));
    
    if (!employee) {
      throw { code: 'EMPLOYEE_NOT_FOUND', message: 'Employee could not be found.' };
    }
    
    // Append any new ratings submitted in this session
    const empRatings = JSON.parse(localStorage.getItem('mock_employee_ratings') || '[]');
    const freshRatings = empRatings.filter(r => r.employeeId === Number(id));
    
    const combinedFeed = [...freshRatings.map((r, i) => ({
      id: `fresh-${i}`,
      customerName: "Recent Customer",
      rating: r.rating || 5,
      comment: r.comment || "No written comment.",
      date: r.createdAt.split('T')[0]
    })), ...employee.ratingsFeed];

    return {
      ...employee,
      ratingsFeed: combinedFeed
    };
  }
}

const employeeService = {
  getEmployeeOfWeek,
  getEmployeeById,
};

export default employeeService;
