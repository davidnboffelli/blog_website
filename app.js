//jshint esversion:6
//require modules
const express = require('express');
const bodyParser = require('body-parser');
const engine = require('ejs-locals');
const mongoose = require('mongoose');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//created an express app which is required above
const app = express();

//using ejs for ease
app.set('view engine', 'ejs');
app.engine('ejs', engine);

//taking input from HTML, setting paths to files to app.js
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//connecting the blog post to a mongoDB, remember 27017 is a default port for mongoDB
// mongoose.connect('mongodb://localhost:27017/blogDB', {
mongoose.connect('mongodb://mongodb:27017/blogDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//schema for blog post
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: {
    data: Buffer,
    contentType: String
  }
});


//model for mongoose
const Post = mongoose.model('Post', postSchema);

//setting the webpage funtionality this is for homepage
app.get('/', function (req, res) {
  Post.find({}, function (err, posts) {
    res.render('home', {
      posts: posts,
    });
  });
});
//where the users are posting (we create a different page for it)
app.get('/compose', function (req, res) {
  res.render('compose');
});
//what after user is done writing the post? we use .post to give response to the user and redirect the user to our / (homepage)
// app.post('/compose', upload.single('image'), function (req, res) {
//   const post = new Post({
//     title: req.body.postTitle,
//     content: req.body.postBody,
//     image: req.file ? {
//       data: req.file.buffer,
//       contentType: req.file.mimetype
//     } : null
//   });

//   console.log('Imagen guardada:', post.image); // Agrega esta línea para depurar

//   post.save(function (err) {
//     if (!err) {
//       res.redirect('/');
//     } else {
//       res.send(err);
//     }
//   });
// });

app.post('/compose', upload.single('image'), function (req, res) {
  // Verifica si req.file está definido y tiene datos
  if (req.file) {
    console.log('Imagen recibida:', req.file); // Depuración para verificar datos de la imagen

    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    });

    post.save(function (err) {
      if (err) {
        console.error('Error al guardar el post:', err); // Depuración para errores
        res.status(500).send('Error al guardar el post');
      } else {
        res.redirect('/');
      }
    });
  } else {
    console.log('No se recibió ninguna imagen');
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });

    post.save(function (err) {
      if (err) {
        console.error('Error al guardar el post sin imagen:', err);
        res.status(500).send('Error al guardar el post');
      } else {
        res.redirect('/');
      }
    });
  }
});


// Dynamically make new URL's when Blog is to viewed on a separate webPage.
app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      postId: requestedPostId,
      title: post.title,
      content: post.content,
      image: post.image
    });
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/edit/:postId', function (req, res) {
  const postId = req.params.postId;
  Post.findById(postId, function (err, foundPost) {
    if (!err) {
      res.render('edit', { post: foundPost });
    } else {
      res.send(err);
    }
  });
});

app.post('/edit/:postId', upload.single('image'), function(req, res) {
  const postId = req.params.postId;

  const updateData = {
    title: req.body.postTitle,
    content: req.body.postBody,
  };

  if (req.file) {
    updateData.image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
  }

  Post.findByIdAndUpdate(postId, updateData, function(err) {
    if (!err) {
      res.redirect('/');
    } else {
      res.send(err);
    }
  });
});

app.get('/image/:postId', function(req, res) {
  const postId = req.params.postId;

  Post.findById(postId, function(err, post) {
    if (err || !post || !post.image) {
      return res.status(404).send('Imagen no encontrada');
    }

    const { data, contentType } = post.image;

    if (!contentType || !data) {
      return res.status(404).send('Imagen no encontrada');
    }

    // Verifica que el contentType sea una cadena válida
    if (typeof contentType !== 'string') {
      return res.status(500).send('Error en el tipo de contenido de la imagen');
    }

    res.contentType(contentType);
    res.send(data);
  });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//other pages of the blog website
app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/contact', function (req, res) {
  res.render('contact');
});

//listening on local server | use a dynamic port when hosting on web.
app.listen(process.env.PORT || 3000, function () {
  console.log('Server started on port : http://localhost:3000');
});
