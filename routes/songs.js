var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var expressJwt = require('express-jwt');
var assert = require('assert');
var   co = require('co');


var postSchema = mongoose.Schema({
  title: String,
  categories: [String],
  content: String,
  authorName: String,
  authorUsername: String,
  authorId: String
});



postSchema.plugin(timestamps);

var Post = mongoose.model('Post', postSchema);

router.get('/songs', function(req, res, next){
    var fileUpdater = require('../routes/fileUpdater');
    var songs;

    fileUpdater.then(promisedResult => {

      console.log('api///fileUpdate');
      /*
      co(function*() {

        console.log(songs);
        var r = yield global.db.collection('songs').insertMany(promisedResult.success);
        assert.equal(resJson.success.length, r.insertedCount);

        // console.log(db);
      }).catch(function(err) {

        console.log(err.stack);
      });
      */
      co(function*() {
        console.log('select');
        songs = yield global.db.collection('songs').find().toArray();
        
        //global.db.close();
        res.json(songs);
        console.log(songs);

     }).catch(function(err) {

        console.log(err.stack);
      });
      
      }
  );
});
   /*
    co(function*() {
    
      songs = yield global.db.collection('songs').find().toArray();
    }).catch(function(err) {
      
      console.log(err.stack);
    });
*/
/*
router.get('/songs', function(req, res, next) {
 
  Post
    .find({})
    .select({
      content: 0,
      __v: 0,
      updatedAt: 0,
      createdAt: 0
    })
    .limit(100)
    .sort({
      createdAt: -1
    })
    .exec(function(err, posts) {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Could not retrieve posts'
        });
      }
     // res.json([{_id:'1', title:'aaaa'}, {_id:'2', title:'bbbb'}]);
     res.json([{ url: 'lost_on_you.mp3',
                 cover: 'http://www.nossoarmario.com/blog/wp-content/uploads/2015/01/redfoo.jpg',
                 artist: {
                          name: 'LP',
                          song: 'Lost on you'
               }
           }
     ])  
  }); 
   // return res.status(200).json();
  // return res.status(200).json({_id:'1', title:'aaaa'});

});
*/
router.post('/posts', expressJwt({secret: process.env.JWT_SECRET}), function(req, res, next) {
  var body = req.body;
  var title = body.title;
  var categories = body.categories;
  var content = body.content;

  //simulate error if title, categories and content are all "test"
  //This is demo field-validation error upon submission. 
  if (title === 'test' && categories === 'test' && content === 'test') {
    return res.status(403).json({
      title: 'Title Error',
      categories: 'Categories Error',
      content: 'Content Error',
      submitmessage: 'Ultimate Error!'
    });
  }

  if (!title || !categories || !content) {
    return res.status(400).json({
      message: 'Error title, categories and content are all required!'
    });
  }

  var post = new Post({
    title: title,
    categories: categories.split(','),
    content: content,
    authorName: req.user ? req.user.name : null,
    authorUsername: req.user ? req.user.username : null,
    authorId: req.user ? req.user._id : null,
    authorImage: req.user ? req.user.image: null
  });


  post.save(function(err, post) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Could not save post'
      });
    }
    res.json(post);
  });
});

router.get('/posts/:id', function(req, res, next) {
  Post.findById({
    '_id': req.params.id
  }, function(err, post) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Could not retrieve post w/ that id'
      });
    }
    if(!post) {
    	return res.status(404).json({message: 'Post not found'})
    }
    res.json(post);
  });
});

router.delete('/posts/:id', expressJwt({secret: process.env.JWT_SECRET}), function(req, res, next) {
  var id = req.params.id;
  if (id.length != 24) {
    return res.json({
      message: 'id must be a valid 24 char hex string'
    });
  }
  var id = mongoose.Types.ObjectId(req.params.id); //convert to objectid
  Post.findByIdAndRemove(id, function(err, post) {
    if (err) throw err;

    if(!post) {
    	return res.status(404).json({message: 'Could not delete post'});
    }

    res.json({
      result: 'Post was deleted'
    });

  });
});

router.post('/posts/validate/fields', function(req, res, next) {
  var body = req.body;
  var title = body.title ? body.title.trim() : '';

  Post.findOne({
    'title': new RegExp(title, "i")
  }, function(err, post) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Could not find post for title uniqueness'
      });
    }
    if (post) {
      res.json({
        title: 'Title "' + title + '" is not unique!'
      });
    } else {
      return res.json({});
    }

  });
}) 

module.exports = router;