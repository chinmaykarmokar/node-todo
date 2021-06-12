const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();

// Serving Static Files
app.use('/public',express.static('./public/'));

// View engine setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Using Body-Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let connection = mysql.createConnection({
    host: "sql6.freemysqlhosting.net",
    user: "sql6406059",
    password: "xS6yR7ljMf",
    database: "sql6406059",
    tls: {
        rejectUnauthorized: false
    }
})

connection.connect((err) => {
    if (err) throw err;
})

// GET Requests

app.get('/', (req,res) => {
    res.render('home', {layout: false});
})

app.get('/signup', (req,res) => {
    res.render('register', {layout: false});
})

// POST Requests

app.post('/insert', (req,res) => {
    let username = req.body.username;
    let listname = req.body.list_items;

    let insertListQuery = "INSERT INTO sample_todo (username, todolist) VALUES (" + "'" + username + "'" + ", " + "'" + listname + "'" + ")";

    connection.query(insertListQuery, (err) => {
        if (err) {
            res.send(err);
        }
        else {
            res.send('Your task is updated successfully!');
            console.log(insertListQuery);
        }
    })
})

app.post('/register', (req,res) => {
    let fName = req.body.f_name;
    let lName = req.body.l_name;
    let userName = req.body.u_name;
    let password = req.body.password;

    let insertQuery = "INSERT INTO users_table (first_name, last_name, user_name, password) VALUES (" + "'" + fName + "'" + ", " + "'" + lName + "'" + ", " + "'" + userName + "'" + ", " + "'" + password + "'" + ")";

    connection.query(insertQuery, (err) => {
        if (err) {
            res.send(err);
        }
        else {
            res.send('You have registered successfully!');
            console.log(insertQuery);
        }
    })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})