var express = require('express');

var app = express(); 

app.use(express.static(__dirname + '/public'));

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());





var users = [], id = 1, users_by_id = {};


_add_user = function(name, age){
  var usr = {name: name, age: age, id: ++id}
  users.push(usr);
  users_by_id[usr.id] = usr;
  return usr;
}

_add_user('john',12);
_add_user('ken',14);
_add_user('joy',33);
_add_user('hue',22);
_add_user('luke',21);

_add_user('johny',33);
_add_user('kertis',14);
_add_user('hurry',33);
_add_user('ludwig',22);
_add_user('kurt',21);

_add_user('luiza',11);
_add_user('jano',14);
_add_user('howard',33);
_add_user('lana',25);
_add_user('klara',21);


_paginated = function(all, page, per_page){
  console.log("all:", all.length, page, per_page);
  if(all.length <= page*per_page)
    next_page = null
  else
    next_page = page+1
  return {users: all.slice((page-1)*per_page, (page-1)*per_page+per_page), total_pages: Math.ceil(all.length / per_page), next_page: next_page, page: page, per_page: per_page}
}


exports.startServer = function(port, path, callback){ 
  app.get('/', function(req, res){ res.sendfile('./public/index.html') }); 
  
  app.post('/upload', multipartMiddleware, function(req, res) {
    data = {data: req.body, files: req.files}
    res.send(JSON.stringify(data));
  });

  app.post('/echo', multipartMiddleware, function(req, res) {
    data = {post: req.body};
    console.log(data);
    res.json({post: req.body});
  });

  app.patch('/echo', multipartMiddleware, function(req, res) {
    res.json({patch: req.body});
  });

  app.delete('/echo', multipartMiddleware, function(req, res) {
    res.json({'delete': req.body});
  });

  app.get('/echo', function(req, res) {
    res.json(req.query);
  });


  app.route('/users')
    .get(function(req, res, next) { 
      var all = users.slice();
      console.log(req.query);
      if(req.query.q){
        all = all.filter(function(u){ return u.name.indexOf(req.query.q)>-1; });
      }
      if(req.query.filter)
      {
        for(key in req.query.filter)
          all = all.filter(function(u){ return u[key] == req.query.filter[key]});
      }

      if(req.query.sort && req.query.sort.length){
        sort_params = req.query.sort;
        for(var i=0, size = sort_params.length; i<size; i++){
          var p = sort_params[i];
          console.log('sort',p);
          for(key in p){
            reverse = p[key] == 'asc'   
            all = all.sort(function(a,b){ 
              if (a[key] == b[key]) return 0;
                if(a[key] < b[key])
                  return (1+(-2*reverse));
                else
                  return (-(1+(-2*reverse)));
            });
          }
        }

      }

      if(req.query.page !=undefined && req.query.per_page !=undefined){
          res.json(_paginated(all,req.query.page|0,req.query.per_page|0))
          return;
      }

      res.json({users: all});
    })
    .post(function(req, res, next) {
      params = req.body
      errors = []
      if(!params.name)
        errors.push('name is missing')
      
      if(!params.age)
        errors.push('age is missing')

      if(errors.length)
        res.json(403, errors)
      else
        res.json({user: {name: params.name,age: params.age, id: ++id}})
      })  

  app.get('/users/:id', function(req,res){
    if(users_by_id[req.params.id])
      res.json({user:users_by_id[req.params.id]})
    else
      res.send(404, 'Not found')
  });

  app.delete('/users/:id', function(req,res){
    if(users_by_id[req.params.id])
      res.json({user:users_by_id[req.params.id]})
    else
      res.send(404, 'Not found')
  });

  app.patch('/users/:id', function(req,res){
    params = req.body
    if(usr=users_by_id[req.params.id])
      res.json({user: {name: params.name||usr.name,age: params.age||usr.age, id: usr.id}})
    else
      res.send(404, 'Not found')
  });

  var server = app.listen(port,callback);
}