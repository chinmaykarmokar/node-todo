const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const url = require('url');

let userIsLoggedIn = {}
let todoItemID = 1;

const app = express();

// Serving Static Files
app.use('/public',express.static('./public/'));

// View engine setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Using Body-Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Databse Connection Credentials

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
    res.render('login', {layout: false});
})

app.get('/signup', (req,res) => {
    res.render('register', {layout: false});
})

// POST Requests

// Register

app.post('/register', (req,res) => {
    let fName = req.body.f_name;
    let lName = req.body.l_name;
    let userName = req.body.u_name;
    let password = req.body.password;

    let insertQuery = "INSERT INTO users_table (first_name, last_name, username, password) VALUES (" + "'" + fName + "'" + ", " + "'" + lName + "'" + ", " + "'" + userName + "'" + ", " + "'" + password + "'" + ")";

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

// Login

app.post('/', (req,res) => {
    let username = req.body.username;
    let password = req.body.password;

    let userLogInCredentials = "SELECT * FROM users_table WHERE username = '" + username + "' AND password = '" + password + "'";

    connection.query(userLogInCredentials, (err,result,fields) => {
            if(result == 0) {
                res.render('login', {layout:false});
            }

            if(result != 0) {
                let usernameInDB = result[0].username;
                let passwordInDB = result[0].password;

                if (usernameInDB == username && passwordInDB == password) {
                    userIsLoggedIn[username] = 1;
                    let showExistingLists = "SELECT * FROM todo_list WHERE username='" + username + "'";

                    connection.query(showExistingLists, (err,result,fields) => {
                        res.render('home', {
                            layout:false,
                            username: username,
                            result: result
                        });
                        //console.log(result);
                    });
                    console.log(userIsLoggedIn);
                }
            }
    })

    console.log(userLogInCredentials);
})

// Insert ToDo Items

app.post('/home', (req,res) => {
    let username = req.body.username;
    let todoListName = req.body.todo_list_name;
    let listItems = req.body.list_items;

    let insertListQuery = "INSERT INTO todo_list (username, todo_list_name, todo_item) VALUES ('" + username + "'" + ", " + "'" + todoListName + "'" + ", " + "'" + listItems + "'" + ")";

    connection.query(insertListQuery, (err,result,fields) => {
        if (err) {
            res.send(err);
        }
        
        else {
            let showExistingLists = "SELECT * FROM todo_list WHERE username='" + username + "'";

            connection.query(showExistingLists, (err,result,fields) => {
                res.render('home', {
                    layout:false,
                    username: username,
                    result: result
                });
                console.log(result);
            });
        }
    })
})

app.get('/delete', (req,res) => {
    let todoListItemvalue = url.parse(req.url,true).query;
    let deleteQuery = "DELETE FROM todo_list WHERE todo_item=" + " '" + todoListItemvalue.todolistItem + "'" + " AND username=" + " '" + todoListItemvalue.username + "'" + "AND todo_list_name= '" + todoListItemvalue.todolistName + "'";
    
    connection.query(deleteQuery, (err,result) => {
        if (err) {
            res.send(err);
        }
        else{
            let showExistingLists = "SELECT * FROM todo_list WHERE username='" + todoListItemvalue.username + "'";

            connection.query(showExistingLists, (err,result,fields) => {
                res.render('home', {
                    layout:false,
                    username: todoListItemvalue.username,
                    result: result
                });
                console.log(result);
            });
        }
    })
    //res.send(todoListItemvalue);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})