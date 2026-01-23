# Expense Server
NOTES:
 
npm init -y : creates a package.json file.
package.json : metadata
nodemon : restarts the server automatically 

diff between dependencies and DevDependencies.

versions : 1.0.0 
least significant - minor changes
most significant - major change


What actually happens when you open the URL
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
