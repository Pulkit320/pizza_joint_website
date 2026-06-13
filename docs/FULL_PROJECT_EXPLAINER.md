# Pizza Joint Full Project Explainer

Welcome to the Pizza Joint project tour! This guide is written for student developers. It explains what the codebase does and how it works.

---

## Part 1 — The Big Picture

### 1.1 What are we actually building?
Pizza Joint is a web application for a modern pizzeria. Customers can browse the menu and order delicious pizzas online. They can also earn rewards points for every order.

After their pizza arrives, customers can rate their delivery driver or server. They can also review their meal. 

For managers, the system includes an administrative dashboard. This dashboard tracks daily sales and customer reviews. It also automatically calculates the "Employee of the Week."

### 1.2 The Request Lifecycle: From Browser to Database
When a user clicks a button, a request travels through the system. Let us trace this journey step by step.

1. **The Browser**: The React frontend sends an HTTP request with data. If logged in, it includes a security token.
2. **The Express Server**: The backend receives the request. The server matches the path to a route.
3. **The Middlewares**: Security guards check the request. They verify the user token and check permissions.
4. **The Controller**: This layer validates the input parameters. It then passes clean data to the service layer.
5. **The Service Layer**: This layer contains the core business logic. It calculates loyalty points or determines ratings eligibility.
6. **The Model**: The model runs raw SQL queries. It retrieves or saves data in the database.
7. **The Relational Database**: PostgreSQL executes the SQL safely. It then sends rows back to the model.
8. **The Return Trip**: The service processes database rows. The controller sends a JSON response back to the client.

### 1.3 Folder Map
Here is where every file lives in this repository.

*   `package.json`: Configures the main Node dependencies and runner scripts.
*   `scripts/`: Contains the database migration helper script.
    *   `migrate.js`: Executes database migrations up or down.
*   `backend/`: Holds all server-side application logic.
    *   `server.js`: The entry point for the Express web server.
    *   `migrations/`: SQL files that build the database schema version by version.
    *   `src/`: The backend source code directory.
        *   `config/`: Establishes the database connection pool.
        *   `controllers/`: Handles incoming HTTP request parameters.
        *   `middleware/`: Restricts route access and handles exceptions.
        *   `models/`: Writes direct SQL queries to get data.
        *   `routes/`: Connects HTTP endpoints to controllers.
        *   `services/`: Evaluates loyalty rules and scores employees.
        *   `utils/`: Contains global helper functions and error codes.
*   `frontend/`: Holds all client-side user interface files.
    *   `package.json`: Configures Vite and React dependencies.
    *   `src/`: The frontend source code directory.
        *   `components/`: Reusable UI elements like navigation bars.
        *   `context/`: Manages global React states like shopping carts.
        *   `hooks/`: Reusable state hooks for components.
        *   `pages/`: Full page views mapped to specific URLs.
        *   `services/`: Executes network requests to the backend.
*   `docs/`: Contains developer guides and system schemas.

### 1.4 The Tech Stack: Why These Tools?
We use modern, industry-standard tools to build this project.

*   **React**: A frontend library for building interfaces. It lets us update the page dynamically without refreshing.
*   **Vite**: A fast build tool. It makes local development quick and compiles files efficiently.
*   **Express**: A minimal backend web framework for Node.js. It simplifies HTTP routing and middleware management.
*   **PostgreSQL**: A robust relational database. It ensures data remains safe, consistent, and structured.
*   **Node-postgres (pg)**: A database driver. It lets our Express application run raw SQL queries directly.
*   **Tailwind CSS**: A utility-first styling framework. It allows developers to style pages quickly by writing classes in HTML.

---

## Part 2 — The Database Layer

### 2.1 Database Basics for Beginners
A database is a digital cabinet that stores structured data. Relational databases store information in tables, which look like spreadsheets.

Tables have columns for data fields and rows for individual records. 

A primary key uniquely identifies a single row in a table. A foreign key links a row in one table to a row in another table.

A database transaction groups multiple commands. If any command fails, all commands are rolled back. This prevents partial data saves.

### 2.2 The Versioned Migrations (V001 - V012)
Migrations are like version control for your database structure. They modify the schema step by step.

*   `V001`: Creates the tracking table that records which migrations have been applied.
*   `V002`: Adds the server employee ID to the orders table to track who served a customer.
*   `V003`: Adds date of birth and referral tracking fields to the customers table.
*   `V004`: Enables the PostgreSQL cryptographic extension for secure UUID generation.
*   `V005`: Creates the order reviews and individual order item ratings tables.
*   `V006`: Creates the employee ratings table to store customer feedback on staff.
*   `V007`: Creates the customer loyalty accounts table to track points and tiers.
*   `V008`: Creates the immutable loyalty ledger table to audit all points changes.
*   `V009`: Creates the referrals table to track customer invitation rewards.
*   `V010`: Creates database indexes to speed up common search queries.
*   `V011`: Creates the Employee of the Week selections table to store calculated winners.
*   `V012`: Creates database triggers that update the modification timestamps automatically.

### 2.3 Down Migrations: The Safety Nets
Every migration has a companion rollback file ending in `.down.sql`. These are database undo buttons.

If a migration fails halfway, the runner executes the rollback commands. This restores the database to its previous stable state.

Rollbacks drop tables, delete columns, or disable extensions created by the original migration.

### 2.4 Database Entity-Relationship Diagram (ERD)
Here is how our tables link together.

```text
  +------------------+             +----------------------+
  |    customers     | <---------* |        orders        |
  +------------------+             +----------------------+
           |                                  |
           | 1                                | 1
           v 1                                v *
  +------------------+             +----------------------+
  | loyalty_accounts |             |     order_items      |
  +------------------+             +----------------------+
           |                                  |
           | 1                                | *
           v *                                v 1
  +------------------+             +----------------------+
  |  loyalty_ledger  |             |       products       |
  +------------------+             +----------------------+
```

### 2.5 The Lifecycle of a Loyalty Point
Let us follow the journey of a single reward point.

First, a customer completes a checkout. The backend calculates points earned based on the order total.

Second, the system updates the customer's balance in the `loyalty_accounts` table.

Third, the system writes a new row to the `loyalty_ledger` table. This creates an audit trail.

Finally, the customer can redeem points for discounts. The system then deducts the points and logs a negative ledger delta.

---

## Part 3 — The Backend

### 3.1 Server.js: The Front Gate
`backend/server.js` starts the backend server. It listens for requests on a network port.

It registers global Express middlewares. These include a JSON request body parser and Cross-Origin Resource Sharing (CORS) configurations.

It mounts route groups under the `/api/v1` URL prefix. Finally, it registers a centralized error handler.

### 3.2 Middleware: The Security Guards
Middlewares are functions that process requests before they reach the route handler.

*   `authenticateToken`: Reads the authorization header. It decodes the JSON Web Token (JWT) to identify the user.
*   `requireRole`: Restricts access based on user role. It blocks unauthorized actions.
*   `errorHandler`: Catches any application error. It logs the details and returns a standardized JSON error response.

### 3.3 Routes, Controllers, Services, and Models
We organize our backend code into distinct layers.

*   **Routes**: Define URL paths and declare which middlewares and controllers handle them.
*   **Controllers**: Read request parameters and invoke services. They format the final JSON API response.
*   **Services**: Implement business rules and logic. They do not know about HTTP requests directly.
*   **Models**: Execute SQL queries. They fetch and modify raw data in the database.

### 3.4 Deep Dive: Points Calculation Rules
The loyalty service handles points calculation. Here are the rules it enforces.

*   **Base Earn Rate**: Earn points for every rupee spent, configured by environment variables.
*   **Tier Multipliers**: Customers in higher tiers earn faster. Dough gets 1.0x, Crust gets 1.2x, and Legend gets 1.5x.
*   **Birthday Bonus**: Earn double points during your birth month.
*   **Referral Bonus**: Referrers earn 200 points after the referred friend places their first order.

### 3.5 Deep Dive: Employee of the Week Algorithm
The Employee of the Week calculation runs on a weekly schedule.

Eligible employees must have worked at least one shift during the week.

The algorithm calculates a score from 0 to 5. It uses three weighted metrics:
1.  **Service Rating**: Accounts for 50% of the score.
2.  **Order Volume**: Accounts for 30% of the score.
3.  **Punctuality**: Accounts for 20% of the score.

If a tie occurs, the employee evaluated first in the list wins. This is because the code uses a strict greater-than operator.

### 3.6 Parameterised Queries: Preventing SQL Injection
SQL injection is a severe security vulnerability. It occurs when hacker input is joined directly with SQL strings.

To prevent this, our models use parameterised queries. We write placeholders like `$1` and `$2` instead of input variables.

The database driver treats placeholders strictly as parameters. It never executes them as SQL commands.

### 3.7 Environment Configuration (.env)
The `.env` file stores system settings and secrets outside the code. This includes database credentials and security keys.

Never commit this file to Git. This prevents leaking private keys to public repositories.

A `.env.example` template is committed instead. This shows new developers what variables they need to define.

---

## Part 4 — The Frontend

### 4.1 React and Vite: The Client Side
The frontend is built with React. React divides the interface into reusable components.

React tracks state changes. It automatically redraws the page when the data updates.

Vite manages the development server. It packages our Javascript and CSS assets for production.

### 4.2 React Component Tree
Here is how components nest inside each other.

```text
       App
        |
  AuthProvider
        |
  CartProvider
        |
  BrowserRouter
     /     \
ClientLayout  AdminRoute
    |             |
  Navbar     AdminDashboard
    |             |
  Pages         Pages
```

### 4.3 Routes and Guards
We use React Router to navigate between views.

*   **Client Routes**: Connect paths like `/menu` to page components.
*   **ProtectedRoute**: Wraps customer pages. It redirects visitors to `/login` if they are not authenticated.
*   **AdminRoute**: Wraps manager pages. It blocks access if the logged-in user is not an admin.

### 4.4 React Context: Global State
React Context lets us share state globally. This avoids passing properties down through many nested components.

*   `AuthContext`: Stores the logged-in user's profile and token. It manages logins and logouts.
*   `CartContext`: Manages item selection, quantities, subtotals, and applied discounts.

### 4.5 API Services
Frontend services handle backend communication.

*   `apiService.js`: Configures an Axios instance with base URLs and request interceptors. It attaches the user's JWT token to every outgoing request.
*   `adminService.js`: Declares calls for admin operations. It contains mock data fallbacks for development.

### 4.6 Deep Dive: The ReviewPage Form
The `ReviewPage` lets customers submit feedback.

The component reads the order ID from the URL path. It renders ratings inputs for overall, food quality, and speed.

Users can also type a written comment. Submitting the form triggers a POST request to `/api/v1/reviews/order`.

### 4.7 Tailwind CSS
Tailwind CSS provides small utility classes. Instead of writing custom CSS files, we apply styles directly in HTML.

For example, `flex items-center justify-between` aligns elements. This approach keeps styling consistent and fast.

---

## Part 5 — The Supporting Files

### 5.1 Git Branching Strategy
We use Git to manage code changes.

*   `main`: The production branch. It contains stable, tested code.
*   `develop`: The integration branch. Developers merge feature branches here.
*   `feature/`: Temporary branches. Developers build features here before merging.

### 5.2 Custom Migration Runner
The script `scripts/migrate.js` runs database migrations.

It connects to the database and checks if the schema migrations table exists.

It compares local SQL files to the database records. It then runs pending migrations in version order.

### 5.3 Documentation Setup
The `docs/` folder houses our design documents.

*   `SCHEMA.md`: Documents tables, column definitions, and constraints.
*   `BRANCHING_GUIDE.md`: Explains how to use Git branches.
*   `MASTER_DOC.md`: Serves as the developer handbook.

### 5.4 Package.json
The `package.json` file is our project manifest.

It lists backend dependencies like `express` and `pg`. It also lists frontend dependencies like `react` and `recharts`.

It defines scripts like `npm run dev` to start Vite.

---

## Part 6 — How Everything Works Together

### 6.1 End-to-End Journeys

#### Journey 1 — A customer places an order
The customer adds pizzas to the cart. They open the checkout page and click submit.

The frontend sends a POST request with the order details.

The backend saves the order, updates loyalty points, and logs ledger events.

#### Journey 2 — A customer rates their server
The customer opens their order history and clicks rate employee.

They select score stars and submit.

The backend validates that the employee worked on the order and saves the rating.

#### Journey 3 — The admin checks Employee of the Week
The manager clicks recalculate on the dashboard.

The server aggregates weekly orders, ratings, and shift data for each employee.

The algorithm calculates scores, saves the winner, and awards them 500 bonus points.

### 6.2 Failure Assessment

Here is what breaks when things go wrong.

| Failed Component | Immediate Symptom | Impacted Features |
| :--- | :--- | :--- |
| Relational Database | Backend queries fail and return 500 errors. | Login, registration, ordering, and admin dashboards are blocked. |
| JWT Secret Key | All auth tokens fail validation. | Logged-in customers and admins are locked out. |
| Tailwind CSS compiler | Frontend styles fail to load. | The website layout appears broken. |
| In-memory token blacklist | Logged-out users can reuse old tokens. | Security is degraded. |
| pg client pool | Backend cannot connect to database. | All API routes fail. |
