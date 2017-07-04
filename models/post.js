const db = require('./db_ops.js');
const db_configs = require('./db_configs.js');
const MongoConnect = db.MongoConnect;
const insertDocument = db.insertDocument;
const findDocumentByQuery = db.findDocumentByQuery;

function Post(username, post) {
  var t = new Date();
  this.username = username;
  this.post = post;
  this.time = t.getFullYear() + '年' + (t.getMonth()+1) + '月' + t.getDate() + '日 ' + t.getHours() + ':' + t.getSeconds();
}

Post.prototype.save = async function() {
  var data = {
    username: this.username,
    post: this.post,
    time: this.time
  };

  var link = db_configs.link;
  var col = db_configs.cols.posts;

  try {
    var dbc = await MongoConnect(link);
    await insertDocument(dbc, col, data);
  } catch(err) {
    return err;
  }
};

Post.get = async function(username) {
  var query = {};
  if(username) {
    query.username = username;
  }
  var link = db_configs.link;
  var col = db_configs.cols.posts;

  try {
    var dbc = await MongoConnect(link);
    var docs = await findDocumentByQuery(dbc, col, query);
    return docs;
  } catch(err) {
    return err;
  }
};

module.exports = Post;