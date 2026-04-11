const db = require('../../config/configDB')

const findAll = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ei.ID, 
        ei.EQUIPMENT_ITEM_Name, 
        ei.EQUIPMENT_ITEM_PurchaseDate,
        ei.EQUIPMENT_ITEM_Price,
        ei.EQUIPMENT_ITEM_Quantity,
        ei.EQUIPMENT_ITEM_Status,
        ei.EQUIPMENT_ITEM_Description,
        em.ID AS EQUIPMENT_MODEL_ID,
        em.EQUIPMENT_MODEL_Name,
        em.EQUIPMENT_MODEL_Branch,
        et.ID AS EQUIPMENT_TYPE_ID,
        et.EQUIPMENT_TYPE_Name,
        et.EQUIPMENT_TYPE_Description
      FROM datn.EQUIPMENT_ITEM ei
      JOIN datn.EQUIPMENT_MODEL em
        ON ei.EQUIPMENT_MODEL_ID = em.ID
      JOIN datn.EQUIPMENT_TYPE et
        ON em.EQUIPMENT_TYPE_ID = et.ID
      WHERE ei.EQUIPMENT_ITEM_Status != 'inactive';
    `;

    db.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};


const findAllRoom = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                r.ID,
                r.ROOM_Name,
                r.ROOM_Capacity,
                r.ROOM_Description,
                r.ROOM_Status,
                r.LOCATION_Building,
                r.LOCATION_Floor,
                rt.ROOM_TYPE_Name,
                rt.ROOM_TYPE_Description
            FROM datn.ROOM r
            JOIN datn.ROOM_TYPE rt ON r.ROOM_TYPE_ID = rt.ID
            WHERE r.ROOM_Status != 'inactive';
        `;

        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const updateEquipment = (data) => {

  if (data.EQUIPMENT_ITEM_PurchaseDate) {
    data.EQUIPMENT_ITEM_PurchaseDate =
      new Date(data.EQUIPMENT_ITEM_PurchaseDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
  }

  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      if (data.EQUIPMENT_ITEM_Name) {
        db.query(`
          UPDATE datn.EQUIPMENT_ITEM
          SET EQUIPMENT_ITEM_Name=?,EQUIPMENT_ITEM_PurchaseDate=?,EQUIPMENT_ITEM_Price=?,
              EQUIPMENT_ITEM_Quantity=?,EQUIPMENT_ITEM_Status=?,EQUIPMENT_ITEM_Description=?
          WHERE ID=?
        `, [
          data.EQUIPMENT_ITEM_Name,
          data.EQUIPMENT_ITEM_PurchaseDate,
          data.EQUIPMENT_ITEM_Price,
          data.EQUIPMENT_ITEM_Quantity,
          data.EQUIPMENT_ITEM_Status,
          data.EQUIPMENT_ITEM_Description,
          data.ID
        ], err => {
          if (err) return db.rollback(()=>reject(err));

          db.query(`
            UPDATE datn.EQUIPMENT_MODEL SET EQUIPMENT_MODEL_Name=?,EQUIPMENT_MODEL_Branch=? WHERE ID=?
          `, [
            data.EQUIPMENT_MODEL_Name,
            data.EQUIPMENT_MODEL_Branch,
            data.EQUIPMENT_MODEL_ID
          ], err => {
            if (err) return db.rollback(()=>reject(err));

            db.query(`
              UPDATE datn.EQUIPMENT_TYPE SET EQUIPMENT_TYPE_Name=?,EQUIPMENT_TYPE_Description=? WHERE ID=?
            `, [
              data.EQUIPMENT_TYPE_Name,
              data.EQUIPMENT_TYPE_Description,
              data.EQUIPMENT_TYPE_ID
            ], err => {
              if (err) return db.rollback(()=>reject(err));
              db.commit(()=>resolve({message:"Update equipment thành công"}));
            });
          });
        });
      }

      else if (data.ROOM_Name) {
        db.query(`
          UPDATE datn.ROOM SET ROOM_Name=?,ROOM_Capacity=?,ROOM_Description=?,ROOM_Status=?,LOCATION_Building=?,LOCATION_Floor=?
          WHERE ID=?
        `, [
          data.ROOM_Name,
          data.ROOM_Capacity,
          data.ROOM_Description,
          data.ROOM_Status,
          data.LOCATION_Building,
          data.LOCATION_Floor,
          data.ID
        ], err => {
          if (err) return db.rollback(()=>reject(err));

          db.query(`
            UPDATE datn.ROOM_TYPE SET ROOM_TYPE_Name=?,ROOM_TYPE_Description=? WHERE ID=?
          `, [
            data.ROOM_TYPE_Name,
            data.ROOM_TYPE_Description,
            data.ROOM_TYPE_ID
          ], err => {
            if (err) return db.rollback(()=>reject(err));
            db.commit(()=>resolve({message:"Update room thành công"}));
          });
        });
      }

      else {
        db.rollback(()=>reject("Unknown data type"));
      }
    });
  });
};


const createEquipment = (data) => {

  if (data.EQUIPMENT_ITEM_PurchaseDate) {
    data.EQUIPMENT_ITEM_PurchaseDate =
      new Date(data.EQUIPMENT_ITEM_PurchaseDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
  }

  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      if (data.EQUIPMENT_ITEM_Name) {

        db.query(`
          INSERT INTO datn.EQUIPMENT_TYPE (EQUIPMENT_TYPE_Name, EQUIPMENT_TYPE_Description)
          VALUES (?, ?)
        `, [
          data.EQUIPMENT_TYPE_Name,
          data.EQUIPMENT_TYPE_Description
        ], (err, rType) => {
          if (err) return db.rollback(()=>reject(err));
          const typeId = rType.insertId;

          db.query(`
            INSERT INTO datn.EQUIPMENT_MODEL (EQUIPMENT_MODEL_Name, EQUIPMENT_MODEL_Branch, EQUIPMENT_TYPE_ID)
            VALUES (?, ?, ?)
          `, [
            data.EQUIPMENT_MODEL_Name,
            data.EQUIPMENT_MODEL_Branch,
            typeId
          ], (err, rModel) => {
            if (err) return db.rollback(()=>reject(err));
            const modelId = rModel.insertId;

            db.query(`
              INSERT INTO datn.EQUIPMENT_ITEM
              (EQUIPMENT_ITEM_Name,EQUIPMENT_ITEM_PurchaseDate,EQUIPMENT_ITEM_Price,
               EQUIPMENT_ITEM_Quantity,EQUIPMENT_ITEM_Status,EQUIPMENT_ITEM_Description,EQUIPMENT_MODEL_ID)
              VALUES (?,?,?,?,?,?,?)
            `, [
              data.EQUIPMENT_ITEM_Name,
              data.EQUIPMENT_ITEM_PurchaseDate,
              data.EQUIPMENT_ITEM_Price,
              data.EQUIPMENT_ITEM_Quantity,
              data.EQUIPMENT_ITEM_Status,
              data.EQUIPMENT_ITEM_Description,
              modelId
            ], err => {
              if (err) return db.rollback(()=>reject(err));
              db.commit(()=>resolve({message:"Thêm thiết bị thành công"}));
            });
          });
        });
      }

      else if (data.ROOM_Name) {

        db.query(`
          INSERT INTO datn.ROOM_TYPE (ROOM_TYPE_Name, ROOM_TYPE_Description)
          VALUES (?, ?)
        `, [
          data.ROOM_TYPE_Name,
          data.ROOM_TYPE_Description
        ], (err, rType) => {
          if (err) return db.rollback(()=>reject(err));
          const typeId = rType.insertId;

          db.query(`
            INSERT INTO datn.ROOM
            (ROOM_Name,ROOM_Capacity,ROOM_Description,ROOM_Status,LOCATION_Building,LOCATION_Floor,ROOM_TYPE_ID)
            VALUES (?,?,?,?,?,?,?)
          `, [
            data.ROOM_Name,
            data.ROOM_Capacity,
            data.ROOM_Description,
            data.ROOM_Status,
            data.LOCATION_Building,
            data.LOCATION_Floor,
            typeId
          ], err => {
            if (err) return db.rollback(()=>reject(err));
            db.commit(()=>resolve({message:"Thêm phòng thành công"}));
          });
        });
      }

      else {
        db.rollback(()=>reject("Unknown data type"));
      }
    });
  });
};


const findOne = (data) => {
  const [idType, type] = data.id.split('|');

  if(type === "equipment"){
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ei.ID, 
          ei.EQUIPMENT_ITEM_Name, 
          ei.EQUIPMENT_ITEM_PurchaseDate,
          ei.EQUIPMENT_ITEM_Price,
          ei.EQUIPMENT_ITEM_Quantity,
          ei.EQUIPMENT_ITEM_Status,
          ei.EQUIPMENT_ITEM_Description,
          em.ID as EQUIPMENT_MODEL_ID,
          em.EQUIPMENT_MODEL_Name,
          em.EQUIPMENT_MODEL_Branch,
          et.ID as EQUIPMENT_TYPE_ID,
          et.EQUIPMENT_TYPE_Name,
          et.EQUIPMENT_TYPE_Description
        FROM datn.EQUIPMENT_ITEM ei
        JOIN datn.EQUIPMENT_MODEL em
          ON ei.EQUIPMENT_MODEL_ID = em.ID
        JOIN datn.EQUIPMENT_TYPE et
          ON em.EQUIPMENT_TYPE_ID = et.ID
        WHERE ei.ID = ? AND ei.EQUIPMENT_ITEM_Status != 'inactive';
      `;

      db.query(sql, [idType], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  if(type === "room"){
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          r.ID,
          r.ROOM_Name,
          r.ROOM_Capacity,
          r.ROOM_Description,
          r.ROOM_Status,
          r.LOCATION_Building,
          r.LOCATION_Floor,
          rt.ID as ROOM_TYPE_ID,
          rt.ROOM_TYPE_Name,
          rt.ROOM_TYPE_Description
        FROM datn.ROOM r
        JOIN datn.ROOM_TYPE rt ON r.ROOM_TYPE_ID = rt.ID
        WHERE r.ID = ? AND r.ROOM_Status != 'inactive';
      `;

      db.query(sql, [idType], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  return Promise.reject(new Error('Type không hợp lệ'));
};


 const deleteEquipment = (data) => {
  return new Promise((resolve, reject) => {
    const { id, type } = data;
    let sql = '';
    let params = [];

    if (type === 'equipment') {
      sql = `UPDATE datn.EQUIPMENT_ITEM SET EQUIPMENT_ITEM_Status = 'inactive' WHERE ID = ?`;
      params = [id];

    } else if (type === 'room') {
      sql = `UPDATE datn.ROOM SET ROOM_Status = 'inactive' WHERE ID = ?`;
      params = [id];

    } else {
      return reject(new Error('Type không hợp lệ'));
    }

    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};


module.exports = {
	findAll,
	findAllRoom,
	findOne,
	updateEquipment,
	createEquipment,
  deleteEquipment
}