Here is a **clean, logically grouped, exam-ready and project-ready version** of your notes, with **proper numbering and flow**, starting from fundamentals → server flow → architecture → databases → async model.

---

# Expense Server – Structured Notes

---

## 1. Project Initialization & Package Management

### 1.1 Initializing an Express Project

* `npm init -y`
  Creates a **package.json** file with default values.

### 1.2 package.json

* Stores **project metadata**

  * name, version, scripts
  * dependencies and devDependencies
* Acts as the **blueprint** of the Node.js project.

### 1.3 nodemon

* Automatically **restarts the server** when file changes are detected.
* Used only during development.

---

## 2. Dependencies vs DevDependencies

### 2.1 dependencies

* Required **at runtime**
* Needed in **production**
* Example:

  * express
  * mongoose
  * cors

### 2.2 devDependencies

* Required **only during development**
* Not needed in production
* Example:

  * nodemon
  * eslint
  * prettier

---

## 3. Versioning (Semantic Versioning)

Format:
**MAJOR.MINOR.PATCH** (example: `1.0.0`)

* **PATCH (least significant)**

  * Bug fixes
* **MINOR**

  * New features (backward compatible)
* **MAJOR (most significant)**

  * Breaking changes

---

## 4. What Happens When You Open a URL (Request–Response Cycle)

1. Browser sends an **HTTP request**
2. Express server receives the request
3. `app.get()` / `app.post()` handler executes (server-side)
4. `console.log()` runs in Node.js (server terminal)
5. `res.send()` sends the response
6. Browser receives and renders the response

---

## 5. Core Express Concepts

---

### 5.1 Middlewares

#### Definition

* A **function that runs between request and response**
* Intercepts requests **before the route handler**

#### Uses

1. Authentication & Authorization
2. Logging requests
3. Parsing request body (`req.body`)
4. Handling CORS errors
5. Adding security headers

#### Example

```js
app.use(express.json());
```

---

### 5.2 Express Router

* Used to **separate routes**
* Improves code readability and scalability
* Helps follow MVC architecture

Example:

```js
const router = express.Router();
router.post('/login', loginController);
```

---

## 6. Controllers, Routes, and DAO

---

### 6.1 Controllers

* **Entry point of business logic**
* Contains functions that process requests
* Organized as objects or functions

Example:

```js
const usersController = {
  login: loginUser,
  register: registerUser
};
```

---

### 6.2 Routes

* Define **valid paths**
* Map HTTP methods to controllers

Example:

```js
router.post('/register', usersController.register);
```

---

### 6.3 DAO (Data Access Object)

* Handles **database operations only**
* Keeps DB logic separate from business logic

---

## 7. Databases (NoSQL Focus)

---

### 7.1 NoSQL Database Principles

* Schema-flexible
* Designed around **access patterns**
* Optimized for scalability

---

### 7.2 MongoDB

* Stores data as **documents**
* Format: **BSON** (Binary JSON)
* Data stored in **collections**
* Documents have a **tree-like structure**

#### Key Design Rules

* Growing data should be stored in a **separate collection**
* Avoid large embedded arrays
* **Document size limit: 16 MB**
* Embedding fails for unbounded data (e.g., user orders)
* Try to keep **number of collections low**

#### Concepts

* **Embedding**: storing related data inside the same document
* **Referencing**: storing IDs instead of nested data

#### Note

* Write operations are **expensive** compared to reads

---

### 7.3 DynamoDB

* Fully managed NoSQL DB (AWS)
* Key-value + document store
* Designed for **high throughput and low latency**

---

## 8. Mongoose

* ODM (Object Data Modeling) library for MongoDB
* Used to define **schemas and models**
* Adds validation and structure to MongoDB documents

---

## 9. Asynchronous Programming in Node.js

---

### 9.1 async functions

* Non-blocking
* Ideal for:

  * Database calls
  * API requests
  * File I/O

Example:

```js
async function getUser() {
  const user = await User.findById(id);
}
```

---

### 9.2 Node.js Execution Model

* Node.js is **single-threaded**
* Uses an **event-driven architecture**
* Long operations are delegated to:

  * Event loop
  * Thread pool (libuv)

#### Result

* Main thread does **not block**
* Server remains responsive

---

## 10. Architectural Summary (Mental Model)

```
Client
  ↓
Middleware
  ↓
Router
  ↓
Controller
  ↓
DAO
  ↓
Database
```

