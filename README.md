# Expense Server

## Initializing an express project 
npm init -y : creates a package.json file.
package.json : metadata
nodemon : restarts the server automatically 

diff between dependencies and DevDependencies.

versions : 1.0.0 
least significant - minor changes
most significant - major change


## What actually happens when you open the URL
Browser sends HTTP request
↓
Express server receives request 
↓
app.get() handler runs (server-side)
↓
console.log() executes in Node
↓
res.send() sends response back
↓
Browser receives response text

## Middlewares
middleware to parse json body. It intercepts all incoming requests before the acutal code executes. It is a function that runs between request and response cycle. used to 
1. authetication 
2. logging in 
3. parsing req body 
4. handling cors errors 
5. security headers*/

## Express Router

## NoSQL Databases
while designing dbs, think about the access patterns.

1. MongoDB (BSON format) : stores data in a tree like format
growing data should be kept in a seperate collection and not in the same table.
records/rows stored as documents that follow a json like structure  called BSON
try to keep the number of collections as low as possible.
embedding - storing the data within the same document.
per record limit of 16 MB only, therefore embedding fails in cases of growing data like orders placed by users.
write operations very expensive in nosql dbs.

2. DynamoDB 


## Controllers and Routers
controllers : entry point of the business logic. objects comprising of business logic in the form of key value pairs like : 
const users = {login : login_function , register: register_function}
routes : valid paths.
dao : data access object