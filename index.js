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
 
  // conn.query(
  // 'CREATE TABLE user_data(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, last_name VARCHAR(40), email VARCHAR(40) not null, contact VARCHAR(10), password VARCHAR(8) not null, complete BOOLEAN)');

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
        console.log(err);
      } else {
          res.redirect('/login_page');
        // console.log(results.rows[0]);
      }
    });
});

app.get('/login_page',(req, res) => {  
    res.render('login_page');
  });


app.post('/login',(req, res) => {
  
  var username = req.body.user_name;
  var password = req.body.password;
  console.log(username);
  console.log(password);
  if (username && password) {  

     let sql =  "SELECT * FROM user_data WHERE id="+username+"";
     let query = conn.query(sql, (err, results) => {
        if (err) {
          console.log(err.stack)
          res.send('Incorrect Username and/or Password!');
        } else {
          req.session.loggedin = true;
          req.session.username = username;
          if(username =='admin' && password == '12345'){
          res.redirect('/home');
          }
          else
          {
           res.redirect('/user_page');
          }
          // console.log(results.rows[0]);
        }
      })
  }
  else {
    res.send('Please enter Username and Password!');
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

app.get('/user_page',(req, res) => {  
  if (req.session.loggedin) {
    res.render('user_page');
  }
  else {
     res.redirect('/login_page');
  }

  });


app.get('/give_quiz',(req, res) => {  
  if (req.session.loggedin) {
    const query = {
      text: 'SELECT * FROM quiz'
     }
     conn.query(query, (err, results) => {
        if (err) {
          console.log(err.stack+'aaaaaaaaaaaaaa');
        } else {
          // console.log(results.rows);
         res.render('user_quiz',{
              results: results.rows
            });

        }
      })
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
  const query = {
        text: 'INSERT INTO quiz(question, option1, option2, option3, option4, answer ) VALUES($1, $2, $3, $4, $5, $6)',
        values: [data.question, data.option1, data.option2, data.option3, data.option4, data.answer],
         }
     conn.query(query, (err, results) => {
      if (err) {
          res.redirect('/home');
        console.log(err);
      } else {
          res.redirect('/view_quiz');
        // console.log(results.rows[0]);
      }
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
    const query = {
      text: 'SELECT * FROM quiz'
     }
     conn.query(query, (err, results) => {
        if (err) {
          // console.log(err.stack+'aaaaaaaaaaaaaa');
        } else {
          // console.log(results.rows);
         res.render('quiz_view',{
              results: results.rows
            });

        }
      })
  }
  else {
     res.redirect('/login_page');
  }

  });

app.post('/submit_test',(req, res) => {  
  
  var i;
  var answer = [];
  var question_id = [];
  var total    = req.body.total;
  for (i = 0 ; i <=total.length; i++) {

     question_id[i] = req.body.question[i];
     answer[i]    = req.body.option[i];  
    
    }
    for (i = 0 ; i <=total.length; i++) {
      // console.log(question_id[i])
      // console.log(answer[i])
      //  console.log("answer")
     }
   if (req.session.loggedin) {
     for (i = 0 ; i <=total.length; i++) {
     let sql = "SELECT answer FROM quiz WHERE id="+question_id[i]+"";
     let query = conn.query(sql, (err, results) => {
        if (err) {
          console.log(err.stack+'aaaaaaaaaaaaaa');
        } else {
         
          console.log(results.rows[0].answer)
         
          // console.log(results.rows);
         res.render('user_quiz',{
              results: results.rows
            });
        }
      })
     } 
    }
  else {
     res.redirect('/login_page');
   }
  });

//server listening
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));