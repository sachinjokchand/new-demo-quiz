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
  'CREATE TABLE new_quiz(id SERIAL PRIMARY KEY, question VARCHAR(255) not null, options VARCHAR(255), answer VARCHAR(255) not null, quiz_time VARCHAR(255))');

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
  secret: "sosecret",
  saveUninitialized: false,
  resave: false
}));

// middleware to make 'user' available to all templates
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


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

   let sql = "SELECT * FROM user_data WHERE email='"+req.body.email+"'";
        let query = conn.query(sql, (err, results) => {
        if (results.rows.length > 0) {
           res.send('Emial already exist');
        }
        else{
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
   }
  });
});

app.get('/login_page',(req, res) => {  
  if (req.session.loggedin) {
    if(req.session.username =='admin@gmail.com'){
          res.redirect('/home');
        }
    else
    {
     res.redirect('/user_page');
    }
   }
    else{
    res.render('login_page');
    }
  });


app.post('/login',(req, res) => {
  
  var username = req.body.user_name;
  var password = req.body.password;
  if (username && password) {  
    
        let sql = "SELECT * FROM user_data WHERE email='"+username+"' AND password='"+password+"'";
        let query = conn.query(sql, (err, results) => {
        if (results.rows.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          if(username =='admin@gmail.com' && password == '12345'){
          res.redirect('/home');
          }
          else
          {
           res.redirect('/user_page');
          }
          // console.log(results.rows[0]);
        }
        else {
          res.send('Incorrect Username and/or Password!');
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

app.post('/setQuestionSession', function(req, res, next){ 
   // console.log(req.body);
   // console.log(JSON.stringify(req.body.correct_ans) );

    sess = req.session;
    var question_data = {
            ques_id : req.body.ques_id,
            ques_timer_time : req.body.timer_time,
            count : req.body.count,
            correct_ans : req.body.selected_option
          }
    sess.question_data = question_data;
    var response =
      {
        'status':'1',
        'massage': 'success',
        'quesId': req.body.qid
      };
    res.send(response);
    res.end();
})


app.post('/setCurrentQuestionTime', function(req, res, next){

  sess = req.session;
  var ques_id = req.body.ques_id;
  var timer_time = req.body.timer_time;
  var count = req.body.count;

    if(sess.question_time){
      var questionSession = sess.question_time;
      if(questionSession.ques_id == ques_id){
        sess.question_time.timer_time = timer_time;
        sess.question_time.count = count;

      }else{
        var question_time = {
        ques_id : req.body.ques_id,
        timer_time : req.body.timer_time, 
        count : count
      } 
      sess.question_time = question_time;
      }
    }else{
      var question_time = {
      ques_id : req.body.ques_id,
      timer_time : req.body.timer_time,
      count : count 
    }
       sess.question_time = question_time;
    } 
    var response = 
      {
        'status':'1',
        'massage': 'success',
        'quesId': req.body.ques_id
      };
    res.send(response);
    res.end(); 
})
app.get('/give_quiz',(req, res) => {  
     sess = req.session;
   if(sess.question_data == '' ){
      var question_data = {};
       question_data = question_data;
    }
  if (req.session.loggedin && req.session.username) {
    // console.log(sess.question_data);
   
    let sql = "SELECT * FROM new_quiz";
    let query = conn.query(sql, (err, results) => {
     if (results.rows.length>0) {
      // console.log(results);
         
         res.render('user_quiz',{
              results: results.rows
            });
        } else {
          console.log(err+'aaaaaaaaaaaaaa');
          // console.log(results.rows);

        }
      })
  }
  else {
      res.render('login_page');
     // res.redirect('/login_page');
  }

  });

app.post('/add_question',(req, res) => {
  
  var question = req.body.question;
  var options_array  = req.body.option;
  var answer_array   = req.body.answer;

  var minute         = req.body.quiz_time_minute;
  var second         = req.body.quiz_time_second;
  var quiz_time      = minute+':'+second;

  var option_obj     = options_array.reduce(function(o, val) { o[val] = val; return o; }, {});
  var answer_obj     = answer_array.reduce(function(o, val) { o[val] = val; return o; }, {});
  var options        = JSON.stringify(option_obj);
  var answer         = JSON.stringify(answer_obj);

  let data = {question: question, options: options, answer: answer, quiz_time: quiz_time};
  const query = {
        text: 'INSERT INTO new_quiz(question, options, answer, quiz_time ) VALUES($1, $2, $3, $4)',
        values: [data.question, data.options, data.answer, data.quiz_time ],
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
  let sql = "UPDATE new_quiz SET question='"+req.body.question+"', options='"+req.body.options+"' , answer='"+req.body.answer+"' , quiz_time='"+req.body.quiz_time+"' WHERE id="+req.body.id;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.redirect('/view_quiz');
  });
});
 
//route for delete data
app.post('/delete',(req, res) => {
  let sql = "DELETE FROM new_quiz WHERE id="+req.body.id+"";
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
      res.redirect('/view_quiz');
  });
});

app.get('/view_quiz',(req, res) => {  
  if (req.session.loggedin) {
    const query = {
      text: 'SELECT * FROM new_quiz'
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

  var correct = 0;  
  var correct_ans = req.body.user_correct_ans;
  var total_question = correct_ans.length;
  var selected_option = [];
  var right_answer = [];
  var  result_data = [];
   
   if (req.session.loggedin) {

        let sql = "SELECT * FROM new_quiz";
        let query = conn.query(sql, (err, results) => {
      
        if (results.rows.length > 0) {
          for(var i = 0; i<results.rows.length; i++) {
             new_options = results.rows[i].answer;
             answer_obj = JSON.parse(new_options);
             
             if(correct_ans[i].length){
               question_arr = correct_ans[i].split(":");
             }
             for (var key in answer_obj) {
             selected_option[i] = question_arr[1];
             right_answer [i]  = key;

                  // if( results.rows[0].answer == answer[0] && results.rows[0].id == question_id[0] )
                 if( question_arr[0] == results.rows[i].id && key == question_arr[1])   
                 {
                  correct++;
                   // console.log(correct);
                 }       
            }

          }
          result_data[0] = 'results = '+correct+' out of '+total_question;
          result_data[1] = 'your selected option = '+ selected_option;
          result_data[2] = 'correct option = ' + right_answer;

          var result_data_obj     = result_data.reduce(function(o, val) { o[val] = val; return o; }, {});
          var result_data_options        = JSON.stringify(result_data_obj);
      
          var response =
              {
                'status':'1',
                'massage': 'success',
                'result_data': result_data_options
              };
          res.send(response);
         // res.render('submit_page',{
          //   result_data: result_data
          // });
        }
      else {
           console.log(err);
           }
        })
  }
else {
      // res.render('login_page');
     res.redirect('/login_page');
   }
});

app.get('/submit_page/(:result_data)', function(req, res, next){
 
console.log( req.params.result_data);

 res.render('submit_page',{
            result_data: req.params.result_data
          });
})


//server listening
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));