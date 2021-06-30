const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
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

// Database Connection Credentials

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

let transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: 'todobychinmay@gmail.com',
        pass: '!champion'
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
            res.send(err);
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

    let updateQuery = "UPDATE todo_list SET todo_item= '" +  + "' WHERE todo_item= '" + todoListNameandItem.todolistItem + "' AND todo_list_name= '" + todoListNameandItem.todolistName + "'";
    
    connection.connect(updateQuery, (err,result) => {
        if (err) {
            res.send(err);
        }
        else {
            res.send(todoListNameandItem)
            // res.render('listwiseitems', {layout: false});
        }
    })
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})