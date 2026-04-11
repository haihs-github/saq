const db = require('../../config/configDB')


const requestSlip = (data) => {
  return new Promise((resolve, reject) => {

    db.beginTransaction(err => {
      if (err) return reject(err);

      const insertSlipSQL = `
        INSERT INTO datn.REQUEST_SLIP
          (REQUEST_SLIP_Name,
           REQUEST_SLIP_RequestDate,
           REQUEST_SLIP_Status,
           REQUEST_SLIP_Description,
           REQUEST_SLIP_ApproveNotes,
           REQUESTER_ID,
           APPROVER_ID)
        VALUES (?, NOW(), ?, ?, NULL, ?, NULL)
      `;

      const slipValues = [
        data.REQUEST_SLIP_Name,
        'Chưa duyệt',
        data.REQUEST_SLIP_Note ,
        data.USER_ID
      ];

      db.query(insertSlipSQL, slipValues, (err, result) => {
        if (err) return db.rollback(() => reject(err));

        const slipId = result.insertId;

        if (!Array.isArray(data.items) || data.items.length === 0) {
          return db.commit(err =>
            err ? reject(err) : resolve({ slipId })
          );
        }

        const insertItemSQL = `
          INSERT INTO datn.REQUEST_ITEM
            (REQUEST_SLIP_ID,
             EQUIPMENT_ITEM_Name,
             EQUIPMENT_ITEM_Description,
             EQUIPMENT_TYPE_Name,
             EQUIPMENT_ITEM_Status,
             REQUEST_ITEM_Status,
             EQUIPMENT_ITEM_ID)
          VALUES (?, ?, ?, ?, ?,?,?)
        `;

        let completed = 0;

        data.items.forEach(item => {
          db.query(
            insertItemSQL,
            [
              slipId,
              item.EQUIPMENT_ITEM_Name,
              item.EQUIPMENT_ITEM_Description,
              item.EQUIPMENT_TYPE_Name,
              item.EQUIPMENT_ITEM_Status,
              item.REQUEST_ITEM_Status,
              item.ID
            ],
            err => {
              if (err) return db.rollback(() => reject(err));

              completed++;
              if (completed === data.items.length) {
                db.commit(err =>
                  err ? reject(err) : resolve({ slipId })
                );
              }
            }
          );
        });
      });
    });
  });
};

const getAllRequestSlip = () => {
  const sql = `
SELECT
  rs.ID AS REQUEST_SLIP_ID,
  rs.REQUEST_SLIP_Name,
  rs.REQUEST_SLIP_RequestDate,
  rs.REQUEST_SLIP_Status,
  rs.REQUEST_SLIP_Description,
  rs.REQUEST_SLIP_ApproveNotes,

  rs.REQUESTER_ID,
  u.USER_FullName,

  ri.ID AS REQUEST_ITEM_ID,
  ri.EQUIPMENT_ITEM_Name,
  ri.EQUIPMENT_ITEM_Description,
  ri.EQUIPMENT_TYPE_Name,
  ri.EQUIPMENT_ITEM_Status,
  ri.REQUEST_ITEM_Status

FROM datn.REQUEST_SLIP rs

LEFT JOIN datn.REQUEST_ITEM ri
  ON rs.ID = ri.REQUEST_SLIP_ID

LEFT JOIN datn.USER u
  ON rs.REQUESTER_ID = u.ID

ORDER BY rs.REQUEST_SLIP_RequestDate DESC;

  `;

  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const approvedSlip = (data) => {

  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);
      const sqlSlip = `
        UPDATE datn.REQUEST_SLIP
        SET REQUEST_SLIP_Status = ?, REQUEST_SLIP_ApproveNotes = ?
        WHERE ID = ?
      `;

      db.query(sqlSlip, [
        data.REQUEST_SLIP_Status,
        data.REQUEST_SLIP_ApproveNotes,
        data.REQUEST_SLIP_ID
      ], err => {
        if (err) return db.rollback(()=>reject(err));

        const items = data.items || [];
        let count = 0;

        if (items.length === 0) {
          return db.commit(()=>resolve({message:"Duyệt phiếu (không có item)"}));
        }

        items.forEach(it => {
          const sqlItem = `
            UPDATE datn.EQUIPMENT_ITEM
            SET EQUIPMENT_ITEM_Status = 'Có sẵn'
            WHERE EQUIPMENT_ITEM_Name = ?
          `;

          db.query(sqlItem, [it.EQUIPMENT_ITEM_Name], err => {
            if (err) return db.rollback(()=>reject(err));
            count++;

            if (count === items.length) {
              db.commit(()=>resolve({message:"Duyệt phiếu & cập nhật thiết bị thành công"}));
            }
          });
        });
      });
    });
  });
};




module.exports = {
	requestSlip,
  getAllRequestSlip,
  approvedSlip
}