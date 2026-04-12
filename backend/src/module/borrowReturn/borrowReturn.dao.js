const db = require('../../config/configDB')

function convertDateArray(dateArray, gioBatDau = 7, phutMoiTiet = 45) {
  const tietHoc = Number(dateArray[0]);
  const ngayString = dateArray[1];

  const ngay = new Date(ngayString);

  const tongPhut = (tietHoc - 1) * phutMoiTiet;
  const gio = gioBatDau + Math.floor(tongPhut / 60);
  const phut = tongPhut % 60;

  ngay.setHours(gio, phut, 0, 0);

  const yyyy = ngay.getFullYear();
  const mm = String(ngay.getMonth() + 1).padStart(2, '0');
  const dd = String(ngay.getDate()).padStart(2, '0');
  const hh = String(ngay.getHours()).padStart(2, '0');
  const mi = String(ngay.getMinutes()).padStart(2, '0');
  const ss = '00';

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}


const findAllBorrowReturn = () => {
  return new Promise((resolve, reject) => {
	const sql = `
	SELECT
		brs.ID AS BORROW_RETURN_SLIP_ID,
		brs.BORROW_RETURN_SLIP_Name,
		brs.BORROW_RETURN_SLIP_Notes,
		brs.BORROW_RETURN_SLIP_Status,
		
		u.ID AS USER_ID,
		u.USER_FullName,
		u.USER_UserName,
		u.USER_Role,

		brd.DATE_BorrowDate,
		brd.DATE_ExceptionReturnDate,
		brd.DATE_ActualReturnDate,

		bri.ID AS BORROW_RETURN_ITEM_ID,

		ei.ID AS EQUIPMENT_ITEM_ID,
		ei.EQUIPMENT_ITEM_Name,
		ei.EQUIPMENT_ITEM_Status,
		ei.EQUIPMENT_ITEM_PurchaseDate,
		ei.EQUIPMENT_ITEM_Price,
		ei.EQUIPMENT_ITEM_Description,

		em.EQUIPMENT_MODEL_Name,
		em.EQUIPMENT_MODEL_Branch,

		et.EQUIPMENT_TYPE_Name,

		r.ID AS ROOM_ID,
		r.ROOM_Name,
		r.ROOM_Status,
		r.ROOM_Capacity,
		r.ROOM_Description,
		r.LOCATION_Building,
		r.LOCATION_Floor,

		rt.ROOM_TYPE_Name

	FROM datn.BORROW_RETURN_SLIP brs
	JOIN datn.\`USER\` u ON brs.USER_ID = u.ID
	JOIN datn.BORROW_RETURN_DATE brd ON brd.BORROW_RETURN_SLIP_ID = brs.ID
	JOIN datn.BORROW_RETURN_ITEM bri ON bri.BORROW_RETURN_SLIP_ID = brs.ID
	LEFT JOIN datn.EQUIPMENT_ITEM ei ON bri.EQUIPMENT_ITEM_ID = ei.ID
	LEFT JOIN datn.EQUIPMENT_MODEL em ON ei.EQUIPMENT_MODEL_ID = em.ID
	LEFT JOIN datn.EQUIPMENT_TYPE et ON em.EQUIPMENT_TYPE_ID = et.ID
	LEFT JOIN datn.ROOM r ON bri.ROOM_ID = r.ID
	LEFT JOIN datn.ROOM_TYPE rt ON r.ROOM_TYPE_ID = rt.ID
	ORDER BY brs.ID;
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

const borrowReturnSlipDAO = (data) => {
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data is empty or invalid');
      }

      const slip = data[0];
      const slipId = slip.BORROW_RETURN_SLIP_ID ?? slip.ID;

      if (!slipId || isNaN(slipId)) {
        throw new Error('Invalid BORROW_RETURN_SLIP_ID');
      }

      db.beginTransaction(err => {
        if (err) return reject(err);

        const updateSlipSQL = `
          UPDATE datn.BORROW_RETURN_SLIP
          SET BORROW_RETURN_SLIP_Status = 'Đã trả'
          WHERE ID = ?
        `;

        db.query(updateSlipSQL, [slipId], err => {
          if (err) return db.rollback(() => reject(err));

          const updateDateSQL = `
            UPDATE datn.BORROW_RETURN_DATE
            SET DATE_ActualReturnDate = CONVERT_TZ(NOW(), '+00:00', '+07:00')
            WHERE BORROW_RETURN_SLIP_ID = ?
          `;

          db.query(updateDateSQL, [slipId], err => {
            if (err) return db.rollback(() => reject(err));

            const items = slip.items || [];

			if (items.length && items[0].EQUIPMENT_ITEM_ID) {

			const updateOneEquipmentSQL = `
				UPDATE datn.EQUIPMENT_ITEM
				SET EQUIPMENT_ITEM_Status = ?
				WHERE ID = ?
			`;

			let completed = 0;

			items.forEach(item => {
				if (!item.EQUIPMENT_ITEM_ID) {
				return db.rollback(() =>
					reject(new Error('EQUIPMENT_ITEM_ID missing'))
				);
				}

				const newStatus =
				item.EQUIPMENT_ITEM_Status === 'Đang mượn'
					? 'Có sẵn'
					: item.EQUIPMENT_ITEM_Status;

				db.query(
				updateOneEquipmentSQL,
				[newStatus, item.EQUIPMENT_ITEM_ID],
				err => {
					if (err) {
					return db.rollback(() => reject(err));
					}

					completed++;
					if (completed === items.length) {
					db.commit(err => err ? reject(err) : resolve(true));
					}
				}
				);
			});
			}


			else {
				const roomId = items[0]?.ROOM_ID;
				const oldStatus = items[0]?.ROOM_Status;

				if (!roomId || !oldStatus) {
					return db.rollback(() => reject(new Error('ROOM_ID or status not found')));
				}

				const newStatus =
					oldStatus === 'Đang mượn'
					? 'Có sẵn'
					: oldStatus;

				const updateRoomSQL = `
					UPDATE datn.ROOM
					SET ROOM_Status = ?
					WHERE ID = ?
				`;

				db.query(updateRoomSQL, [newStatus, roomId], err => {
					if (err) return db.rollback(() => reject(err));
					db.commit(err => err ? reject(err) : resolve(true));
				});
			}

          });
        });
      });

    } catch (error) {
      reject(error);
    }
  });
};




const findByUserBorrowReturnSlipDAO = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        brs.ID,
        brs.BORROW_RETURN_SLIP_Name,
        brs.BORROW_RETURN_SLIP_Status,
        brs.BORROW_RETURN_SLIP_Notes,
        brs.USER_ID,

        brd.DATE_BorrowDate,
        brd.DATE_ExceptionReturnDate,
        brd.DATE_ActualReturnDate
      FROM datn.BORROW_RETURN_SLIP brs
      JOIN datn.BORROW_RETURN_DATE brd 
        ON brd.BORROW_RETURN_SLIP_ID = brs.ID
      WHERE brs.USER_ID = ?
      ORDER BY brs.ID DESC
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const findAllBorrowReturnSlipDAO = (data)=>{
   return new Promise((resolve,reject)=>{
	const sql = 
	`
	SELECT
		brs.ID                         AS BORROW_RETURN_SLIP_ID,
		brs.BORROW_RETURN_SLIP_Name,
		brs.BORROW_RETURN_SLIP_Status,
		brs.BORROW_RETURN_SLIP_Notes,
		brs.USER_ID,

		brd.ID                         AS BORROW_RETURN_DATE_ID,
		brd.DATE_BorrowDate,
		brd.DATE_ExceptionReturnDate,
		brd.DATE_ActualReturnDate,

		bri.ID                         AS BORROW_RETURN_ITEM_ID,
		bri.EQUIPMENT_ITEM_ID
	FROM datn.BORROW_RETURN_SLIP brs
	JOIN datn.BORROW_RETURN_DATE brd
		ON brs.ID = brd.BORROW_RETURN_SLIP_ID
	JOIN datn.BORROW_RETURN_ITEM bri
		ON brs.ID = bri.BORROW_RETURN_SLIP_ID;

	`
	db.query(sql,(err,results)=>{
		if(err){
			reject(err)
		}else {
			resolve(results[0])
		}
	})
   })
} 
const createBorrowReturnSlipDAO = (data) => {
	if(data.equipments[0].EQUIPMENT_ITEM_Name){
		return new Promise((resolve, reject) => {
	  
		  let itemSql = '';
	  
		  data.equipments.forEach(item => {
			itemSql += `
			  INSERT INTO datn.BORROW_RETURN_ITEM 
				(EQUIPMENT_ITEM_ID, BORROW_RETURN_SLIP_ID)
			  VALUES
				(${item.ID}, @slipId);
	  
			  UPDATE datn.EQUIPMENT_ITEM
			  SET EQUIPMENT_ITEM_Status = 'Đang mượn'
			  WHERE ID = ${item.ID};
			`;
		  });
	  
		  const sql = `
			INSERT INTO datn.BORROW_RETURN_SLIP 
			  (BORROW_RETURN_SLIP_Status, BORROW_RETURN_SLIP_Name, BORROW_RETURN_SLIP_Notes, USER_ID)
			VALUES
			  ('Chưa trả', '${data.BORROW_RETURN_SLIP_Name}', '${data.Note}', ${data.USER.ID});
	  
			SET @slipId = LAST_INSERT_ID();
	  
			INSERT INTO datn.BORROW_RETURN_DATE 
			  (DATE_BorrowDate, DATE_ExceptionReturnDate, DATE_ActualReturnDate, BORROW_RETURN_SLIP_ID)
			VALUES
			  ('${convertDateArray(data.StartDate)}',
			   '${convertDateArray(data.EndDate)}',
			   NULL,
			   @slipId);
	  
			${itemSql}
		  `;
	  
		  db.query(sql, (err, results) => {
			if (err) {
			  reject(err);
			} else {
			  resolve({
				borrowReturnSlipId: results[0].insertId,
				equipments: data.equipments.map(e => e.ID),
				message: 'Tạo phiếu mượn thành công'
			  });
			}
		  });
		});
	}else {
		return new Promise((resolve, reject) => {
	  
		  let itemSql = '';
	  
		  data.equipments.forEach(item => {
			itemSql += `
			  INSERT INTO datn.BORROW_RETURN_ITEM 
				(ROOM_ID, BORROW_RETURN_SLIP_ID)
			  VALUES
				(${item.ID}, @slipId);
	  
			  UPDATE datn.ROOM
			  SET ROOM_Status = 'Đang mượn'
			  WHERE ID = ${item.ID};
			`;
		  });
	  
		  const sql = `
			INSERT INTO datn.BORROW_RETURN_SLIP 
			  (BORROW_RETURN_SLIP_Status, BORROW_RETURN_SLIP_Name, BORROW_RETURN_SLIP_Notes, USER_ID)
			VALUES
			  ('Chưa trả', '${data.BORROW_RETURN_SLIP_Name}', '${data.Note}', ${data.USER.ID});
	  
			SET @slipId = LAST_INSERT_ID();
	  
			INSERT INTO datn.BORROW_RETURN_DATE 
			  (DATE_BorrowDate, DATE_ExceptionReturnDate, DATE_ActualReturnDate, BORROW_RETURN_SLIP_ID)
			VALUES
			  ('${convertDateArray(data.StartDate)}',
			   '${convertDateArray(data.EndDate)}',
			   NULL,
			   @slipId);
	  
			${itemSql}
		  `;
	  
		  db.query(sql, (err, results) => {
			if (err) {
			  reject(err);
			} else {
			  resolve({
				borrowReturnSlipId: results[0].insertId,
				equipments: data.equipments.map(e => e.ID),
				message: 'Tạo phiếu mượn thành công'
			  });
			}
		  });
		});
	}
};



module.exports = {
	convertDateArray,
	findAllBorrowReturn,
	findByUserBorrowReturnSlipDAO,
	findAllBorrowReturnSlipDAO,
	createBorrowReturnSlipDAO,
	borrowReturnSlipDAO
}