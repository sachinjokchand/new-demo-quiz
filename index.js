const cool = require('cool-ascii-faces'); 
//use path module
var path = require('path');
//use express module
var express = require('express');
//use ejs view engine
var session = require('express-session');

const PORT = process.env.PORT || 5000

var ejs = require('ejs');
//use bodyParser middleware
var bodyParser = require('body-parser');
//use mysql database
var mysql = require('mysql');

var app = express();

let pg = require('pg');
if (process.env.DATABASE_URL) {
  pg.defaults.ssl = true;
}

let connString = process.env.DATABASE_URL || 'postgres://gcbtdmukjhvuks:df4bd356660088691211fc9d0d55ad435edb3922bf2c60d1b67fd865fb78f26c@ec2-107-21-122-38.compute-1.amazonaws.com:5432/dfstnb08u0plsu';
const { Pool } = require('pg');

const conn = new Pool({
  connectionString : connString
});
 
  conn.query(
  'CREATE TABLE user_data(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, last_name VARCHAR(40), email VARCHAR(40) not null, contact VARCHAR(10), password VARCHAR(8) not null, complete BOOLEAN)');

//Create connection
// var conn = mysql.createConnection({
//   host: 'ec2-174-129-255-69.compute-1.amazonaws.com',
//   user: 'pblfnftsdjildz',
//   password: 'afe98a1cdf48a05766c49a0750a9a7b0d4adac49094ecc4d0ad6a24b859908df',
//   database: 'd6skc9j2bc3442'
// });
 
//connect to database
// conn.connect((err) =>{
//   if(err) throw err;
//   console.log('Mysql Connected...');
// });
 
//set views file
app.set('views',path.join(__dirname,'views'));

//set view engine
app.set('view engine', 'ejs');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
//set public folder as static folder for static file
app.use('/assets',express.static(__dirname + '/public'));
 
app.get('/cool', (req, res) => res.send(cool()));
//route for homepage
app.get('/',(req, res) => {  
    res.render('registration',{
    });
  });
 
//route for insert data
app.post('/signup',(req, res) => {
  let data = {name: req.body.name, last_name: req.body.last_name, email: req.body.email, contact: req.body.contact, password: req.body.password};
  const query = {
        text: 'INSERT INTO user_data(name, last_name, email, contact, password ) VALUES($1, $2, $3, $4, $5)',
        values: [data.name, data.last_name, data.email, data.contact, data.password],
         }
     conn.query(query, (err, results) => {
      if (err) {
          res.redirect('/');
        console.log(err)
      } else {
          res.redirect('/login_page');
        console.log(results.rows[0])
      }
    })
});

app.get('/login_page',(req, res) => {  
    res.render('login_page');
  });


app.post('/login',(req, res) => {
  
  var username = req.body.user_name;
  var password = req.body.password;
  if (username && password) {  
  
   // let sql = "SELECT * FROM user_data WHERE email = '"+username+"' AND password = '"+password+"'";
  let sql = "SELECT * FROM user_data";
  let query = conn.query(sql, (err, results) => {
    if (results.length > 0) {
      console.log(results);
      console.log(query);
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/home');
      } else {
        res.send('Incorrect Username and/or Password!');
      }     
      res.end();
  });
  }
  else {
    res.send('Please enter Username and Password!');
    res.end();
  }
});

app.get('/home',(req, res) => {  
  if (req.session.loggedin) {
    res.render('home');
  }
  else {
     res.redirect('/login_page');
  }

  });

app.get('/logout',(req, res) => {  
  req.session.destroy((err) => {
      if(err) {
          return console.log(err);
      }
      res.redirect('/login_page');
  });

  });


app.get('/add_quiz',(req, res) => {  
  if (req.session.loggedin) {
    res.render('add_quiz');
  }
  else {
     res.redirect('/login_page');
  }

  });

app.post('/add_question',(req, res) => {
  
  var question = req.body.question;
  var option1  = req.body.option1;
  var option2  = req.body.option2;
  var option3  = req.body.option3;
  var option4  = req.body.option4;
  var answer   = req.body.answer;

  let data = {question: question, option1: option1, option2: option2, option3: option3, option4: option4 , answer: answer};
  let sql = "INSERT INTO quiz SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    // res.redirect('/login_page');
   res.redirect('/view_quiz');
  });
});

app.post('/update',(req, res) => {
  let sql = "UPDATE quiz SET question='"+req.body.question+"', option1='"+req.body.option1+"' , option2='"+req.body.option2+"' , option3='"+req.body.option3+"' , option4='"+req.body.option4+"' , answer='"+req.body.answer+"' WHERE id="+req.body.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.redirect('/view_quiz');
  });
});
 
//route for delete data
app.post('/delete',(req, res) => {
  let sql = "DELETE FROM quiz WHERE id="+req.body.id+"";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
      res.redirect('/view_quiz');
  });
});

app.get('/view_quiz',(req, res) => {  
  if (req.session.loggedin) {
    let sql = "SELECT * FROM quiz";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.render('quiz_view',{
      results: results
    });
  });
  }
  else {
     res.redirect('/login_page');
  }

  });

//server listening
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));