const crypto = require('crypto');

//对密码加密
function encryptData(data) {
    var hash = crypto.createHash('md5');
    hash.update(data);
    var crypted_data = hash.digest('hex');
    return crypted_data;
}

module.exports = {encryptData};