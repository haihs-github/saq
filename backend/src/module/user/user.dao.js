const db = require('../../config/configDB')

const findAll = (data)=> {
	return new Promise((resolve, reject) => {
		const sql = `SELECT * FROM datn.USER`
		db.query(sql,(err,results)=>{
			if(err){
				reject(err)
			} else {
				resolve(results)
			}
		}) 
	})
}

const findOneUser = (id)=> {
	const sql =`SELECT * FROM datn.USER WHERE ID = ${id}`
	return new Promise((resolve, reject) => {
		db.query(sql,(err,results)=>{
			if(err){
				reject(err)
			} else {
				resolve(results[0])
			}
		}) 
	})
}
const createUser = (data) => {
  return new Promise((resolve, reject) => {

    const checkSql = `
      SELECT ID 
      FROM datn.USER 
      WHERE USER_UserName = ? OR USER_Email = ?
      LIMIT 1
    `;

    db.query(
      checkSql,
      [data.USER_UserName, data.USER_Email],
      (err, rows) => {
        if (err) return reject(err);

        if (rows.length > 0) {
          return reject({
            message: 'Username hoặc Email đã tồn tại'
          });
        }

        const insertSql = `
          INSERT INTO datn.USER
            (USER_FullName, USER_Email, USER_PhoneNumber, USER_UserName, USER_Password, USER_Role, USER_Status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            data.USER_FullName,
            data.USER_Email,
            data.USER_PhoneNumber,
            data.USER_UserName,
            data.USER_Password, 
            data.USER_Role,
            data.USER_Status || 'Active'
          ],
          (err, result) => {
            if (err) return reject(err);
            resolve({ id: result.insertId });
          }
        );
      }
    );
  });
};
const updateUser = (data) => {
  console.log('📥 UPDATE USER DATA:', data);

  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE datn.USER SET
        USER_FullName     = ?,
        USER_Email        = ?,
        USER_PhoneNumber  = ?,
        USER_UserName     = ?,
        USER_Password     = ?,
        USER_Role         = ?,
        USER_Status       = ?
      WHERE ID = ?
    `;

    const params = [
      data.USER_FullName,
      data.USER_Email,
      data.USER_PhoneNumber,
      data.USER_UserName,
      data.USER_Password,
      data.USER_Role,
      data.USER_Status,
      data.ID
    ];

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('❌ UPDATE USER ERROR');
        console.error(err);
        return reject(err);
      }

      resolve({
        message: 'Cập nhật thành công',
        affectedRows: result.affectedRows
      });
    });
  });
};
const deleteUserById = (id) => {
  console.log('🗑️ DELETE USER ID:', id);

  return new Promise((resolve, reject) => {
    const sql = `
      DELETE FROM datn.USER
      WHERE ID = ?
    `;

    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('❌ DELETE USER ERROR');
        console.error(err);
        return reject(err);
      }

      resolve({
        message: 'Xóa người dùng thành công',
        affectedRows: result.affectedRows
      });
    });
  });
};


const findUserNameAndPassword = (data)=>{

	return new Promise((resolve,reject)=>{
		const sql = `SELECT * FROM datn.USER WHERE USER_UserName = '${data.userName}' AND USER_Password = '${data.password}' AND USER_Status = 'Active'`
		db.query(sql,(err,results)=>{
			if(err){
				reject(err)
			}else {
				resolve(results[0])
			}
		})
	})
} 



module.exports = {
	findAll,
	createUser,
	findUserNameAndPassword,
	updateUser,
	deleteUserById,
	findOneUser
}