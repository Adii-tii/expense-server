const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    console.log('get req received');
    res.send('your req has been received');
})

app.get('/users', (req, res)=> {
    res.send("hello user!");
})

app.get('/admin', (req, res) =>{
    res.send("hello admin!");
})

app.post('/addUser', (req, res) => {
    console.log(req.body);
    const {username, ...rest}= req.body;

    const fs = require('fs');
    fs.appendFileSync('users.txt', `${username}\n`);

    res.send(`hello ${username}, your data has been received`);
})

app.get('/add', (req, res) => {
    const {a, b} = req.body;
    const sum = a + b;

    
})


app.get('/math', (req, res) => {
    const {a, b, operation} = req.query;
    let result = 0;
    
    if(isNaN(a) || isNaN(b)){
        return res.status(400).send('invalid inputs');
    } 

    if(operation === 'add'){
        result = Number(a) + Number(b);
    }else if(operation === 'subtract'){
        result = Number(a) - Number(b);
    }else{
        return res.send('invalid operation!')
    }
    res.send(`the result is ${result}`);
});


    app.listen(3000, () => {
    console.log('server running on port 3000');
})

