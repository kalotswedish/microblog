const db = require('./db_ops.js');
const db_configs = require('./db_configs.js');
const MongoConnect = db.MongoConnect;
const insertDocument = db.insertDocument;
const findDocumentByQuery = db.findDocumentByQuery;

//定义User类  //后续用ES6的class再定义一次
function User(user) {
  this.username = user.username,
  this.password = user.password
}

//定义User类的save方法，用于保存用户数据
User.prototype.save = async function() {
  var data = {
    username : this.username,
    password : this.password
  };
  
  var link = db_configs.link;
  var col = db_configs.cols.users;
  try {
    var dbc = await MongoConnect(link);
    await insertDocument(dbc, col, data);
  } catch(err) {
    return err;
  }
};

//定义get方法，用于取出用户数据
User.get = async function(username) {
  var query = {};
  if ((typeof username == 'string') && (username !=='')) {
    query.username = username;
  }
  var link = db_configs.link;
  var col = db_configs.cols.users;

  try {
    var dbc = await MongoConnect(link);
    var docs = await findDocumentByQuery(dbc, col, query);
    return docs;
  } catch(err) {
    return err;
  }
};

module.exports = User;
