const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const url = require('url');
const credentials = require('./public/js/modules');
var favicon = require('serve-favicon');

let userIsLoggedIn = {}
let todoItemID = 1;

const app = express();

// Serving Static Files
app.use('/public',express.static('./public/'));

// Serve Favicon 
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// View engine setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Using Body-Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Database Connection Credentials

let connection = mysql.createConnection({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
    tls: {
        rejectUnauthorized: false
    }
})

connection.connect((err) => {
    if (err) throw err;
})

// Gmail SMTP setup

let transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: credentials.email,
        pass: credentials.pass
    }
});

// Render Views

app.get('/', (req,res) => {
    res.render('login', {layout: false});
})

app.get('/signup', (req,res) => {
    res.render('register', {layout: false});
})

// Register

app.post('/register', (req,res) => {
    let fName = req.body.f_name;
    let lName = req.body.l_name;
    let email = req.body.email;
    let userName = req.body.u_name;
    let password = req.body.password;

    let insertQuery = "INSERT INTO users_table (first_name, last_name, username, password) VALUES (" + "'" + fName + "'" + ", " + "'" + lName + "'" + ", " + "'" + userName + "'" + ", " + "'" + password + "'" + ")";

    connection.query(insertQuery, (err) => {
        if (err) {
            let errorMessage = err.sqlMessage.slice(0,15);
            res.render('error', {
                layout: false,
                errorMessage: errorMessage + '. This username already exists.'
            });
        }
        else {
            let mailOptions = {
                from: 'todobychinmay@gmail.com',
                to: email,
                subject: 'To Do by Chinmay: Registered successfully!',
                html: `<p>Thank you for using <b>To Do by Chinmay</b>, you have registered successfully on our platform!</p>
                <p>Login with the following credentials and create your first To Do List!</p>
                <p><b>Username: </b>` + userName + `</p>
                <p><b>Password: </b>` + password + `</p>
                <p><Do not share these credentials with anyone. Thank you!/p>`
            };
    
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.render('login', {layout: false});
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
                    let showExistingLists = "SELECT * FROM userwise_todolist_name WHERE username='" + username + "'";

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

// Create ToDo List with specific Username

app.post('/home', (req,res) => {
    let username = req.body.username;
    let todoListName = req.body.todo_list_name;
    //let listItems = req.body.list_items;

    let insertListQuery = "INSERT INTO userwise_todolist_name (username, todo_list_name) VALUES ('" + username + "'" + ", " + "'" + todoListName + "'" + ")";

    connection.query(insertListQuery, (err,result,fields) => {
        if (err) {
            res.send(err);
        }
        
        else {
            let showExistingLists = "SELECT * FROM userwise_todolist_name WHERE username='" + username + "'";

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

// Add Items to a particular Todo list

app.get('/add', (req,res) => {
    let todoListNameObject = url.parse(req.url,true).query;

    let selectQuery = "SELECT * FROM todo_list WHERE username= '" + todoListNameObject.username + "' AND todo_list_name= '" + todoListNameObject.todolistName + "'";
    
    connection.query(selectQuery, (err,result,fields) => {
        res.render('listwiseitems', {
            layout: false,
            result: result,
            username: todoListNameObject.username,
            todolistName: todoListNameObject.todolistName
        });
    })
})

app.post('/add', (req,res) => {
    let username = req.body.username;
    let todoListName = req.body.todo_list_name;
    let todoListItem = req.body.todo_list_item;

    let insertQuery = "INSERT INTO todo_list (username, todo_list_name, todo_item) VALUES ('" + username + "', '" + todoListName + "', '" + todoListItem + "')";

    connection.query(insertQuery, (err,result,fields) => {
        if (err) {
            res.send(err);
        }
        else {
            let showExistingItemsInList = "SELECT * FROM todo_list WHERE username='" + username + "' AND todo_list_name='" + todoListName + "'";

            connection.query(showExistingItemsInList, (err,result,fields) => {
                res.render('listwiseitems', {
                    layout: false,
                    username: username,
                    todolistName: todoListName,
                    result: result
                });
                console.log(result);
            });
        }
    })
})

// Delete Item from a particular Todo list

app.get('/delete', (req,res) => {
    let todoListItemvalue = url.parse(req.url,true).query;
    let deleteQuery = "DELETE FROM todo_list WHERE todo_item=" + " '" + todoListItemvalue.todolistItem + "'" + " AND username=" + " '" + todoListItemvalue.username + "'" + "AND todo_list_name= '" + todoListItemvalue.todolistName + "'";
    
    connection.query(deleteQuery, (err,result) => {
        if (err) {
            res.send(err);
        }
        else{
            let showExistingLists = "SELECT * FROM todo_list WHERE username='" + todoListItemvalue.username + "' AND todo_list_name='" + todoListItemvalue.todolistName + "'";

            connection.query(showExistingLists, (err,result,fields) => {
                res.render('listwiseitems', {
                    layout:false,
                    username: todoListItemvalue.username,
                    todolistName: todoListItemvalue.todolistName,
                    result: result
                });
                console.log(result);
            });
        }
    })
    //res.send(todoListItemvalue);
})

// Delete Todo List

app.get('/deleteList', (req,res) => {
    let todoListNameObject = url.parse(req.url,true).query;
    
    let deleteQuery = "DELETE FROM userwise_todolist_name WHERE username= '" + todoListNameObject.username + "' AND todo_list_name= '" + todoListNameObject.todolistName + "'"

    connection.query(deleteQuery, (err,result) => {
        if (err) {
            res.send(err);
        }

        else {
            let showExistingTodoLists = "SELECT * FROM userwise_todolist_name WHERE username='" + todoListNameObject.username + "'";
 
            connection.query(showExistingTodoLists, (err,result,fields) => {
                res.render('home', {
                    layout: false,
                    username: todoListNameObject.username,
                    todolistName: todoListNameObject.todolistItem,
                    result: result
                })
            })
        }
    })
})

// Update Todo list item 

app.get('/update', (req,res) => {
    let todoListNameandItem = url.parse(req.url,true).query;

    // let updateQuery = "UPDATE todo_list SET todo_item= '" +  + "' WHERE todo_item= '" + todoListNameandItem.todolistItem + "' AND todo_list_name= '" + todoListNameandItem.todolistName + "'";
    
    // res.send(todoListNameandItem);
    res.render('update', {
        layout: false,
        username: todoListNameandItem.username,
        listName: todoListNameandItem.todolistName,
        listItem: todoListNameandItem.todolistItem
    })
})

app.post('/update', (req,res) => {
    let username = req.body.username;
    let listName = req.body.listname;
    let listItem = req.body.listitem;
    let updatedItem = req.body.updateditem;

    let updateQuery = "UPDATE todo_list SET todo_item= '" + updatedItem + "' WHERE todo_item= '" + listItem + "' AND todo_list_name= '" + listName + "'";

    connection.query(updateQuery, (err,result) => {
        if (err) {
            res.send(err);
        }
        else {
            let showExistingLists = "SELECT * FROM todo_list WHERE username='" + username + "' AND todo_list_name='" + listName + "'";
            
            connection.query(showExistingLists, (err,result,fields) => {
                res.render('listwiseitems', {
                    layout:false,
                    username: username,
                    todolistName: listName,
                    result: result
                });
                console.log(result);
            });
        }
    })
})

// Directing to improper routes

app.get('*', (req,res) => {
    res.render('error', {
        layout: false,
        errorMessage: 'Invalid. Page not found. Sign In to continue.'
    })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})