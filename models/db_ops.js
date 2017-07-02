const MongoClient = require('mongodb').MongoClient;

//连接数据库
function MongoConnect(link) {
    return new Promise(function(resolve, reject) {
        MongoClient.connect(link, function(err, db) {
            if (err) {
                console.log('Error connecting database.');
                reject(new Error(err.message));
            } else {
                console.log('Database connected');
                resolve(db);
            }   
        });
    });             
}

//插入一条数据
function insertDocument(db, col, data) {
    return new Promise(function(resolve, reject) {
        db.collection(col).insertOne(data, function(err, result) {
            if (err) {
                console.log('Error querying database.');
                reject(new Error(err.message));
            } else {
                console.log('One piece of data inserted');
                resolve(result);
                db.close();
            }
        });
    });
} 

//查询数据
function findDocumentByQuery(db, col, query) {
    return new Promise(function(resolve, reject) {
        var collection = db.collection(col);
        collection.find(query).toArray(function(err, docs) {
            if (err) {
                console.log('Error querying database.');
                reject(new Error(err.message));
            } else {
                console.log('Docs found!');
                resolve(docs);
            }
            db.close();
        });
    });
}

module.exports = {MongoConnect, insertDocument, findDocumentByQuery};