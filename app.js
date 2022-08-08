// app.js
import express from "express";
import mysql from "mysql2/promise";
import axios from "axios";
import cors from 'cors';

const app = express();
app.use(cors())
app.use(express.json());

const port = 4000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getData = async () => {
  const data = await axios.get("http://localhost:4000/todos");
  console.log("async await", data);
};

app.get("/todos/:id/:contentId", async (req, res) => {
  // query 여러개 받기
  const data = {
    todos: {
      id: req.query.id,
      contentId: req.query.contentId,
    },
  };

  const {
    todos: { id, contentId },
  } = data;

  console.log("id", id);
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo");

  //getData();
  res.json(rows);
});

app.get("/todos/:id/", async (req, res) => {
  //const id = req.query.id;
  const { id } = req.query;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(rows[0]);
});

app.patch("/todos/check/:id", async (req, res) => {
  const {id} = req.params;

  const [[todoRow]] = await pool.query (
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  );
  if (!todoRow) {
    res.status(404).json({
      msg: "not found",
    });
  }

  await pool.query(
    `
    UPDATE todo
    SET checked = ?
    WHERE id = ? `, 
    [!todoRow.checked, id]
  );
  res.send(id);

});

app.patch('/todos/:id', async (req, res) => {
  const { id } = req.params
  const { perform_date, text } = req.body
  const [rows] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  )
  if (rows.length === 0) {
    res.status(404).json({
      msg: 'not found',
    })
  }
  if (!text) {
    res.status(400).json({
      msg: 'text required',
    })
    return
  }
  const [rs] = await pool.query(
    `
    UPDATE todo
    SET text = ?
    WHERE id = ?
    `,
    [text, id]
  )
  res.json({
    msg: `${id}번 할일이 수정되었습니다.`,
  })
})

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?`,
    [id]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `DELETE FROM todo
    WHERE id = ?`,
    [id]
  );
  res.json({
    msg: `${id}번 할일이 삭제되었습니다.`,
  });
});


// app.post("/todos", async (req, res) => {
//   const { reg_date } = req.body;
//   const { perform_date } = req.body;
//   const { checked } = req.body;
//   const { text } = req.body;

//   const [[rows]] = await pool.query(`SELECT * FROM todo`);

//   if (rows.length === 0) {
//     res.status(404).json({
//       msg: "not found",
//     });
//   }
//   if (!reg_date) {
//     res.status(400).json({
//       msg: "reg_date required",
//     });
//     return;
//   }
//   if (!perform_date) {
//     res.status(400).json({
//       msg: "perform_date required",
//     });
//     return;
//   }
//   if (!checked) {
//     res.status(400).json({
//       msg: "checked required",
//     });
//     return;
//   }
//   if (!text) {
//     res.status(400).json({
//       msg: "text required",
//     });
//     return;
//   }
//   const [rs] = await pool.query(
//     `
//     INSERT todo SET
//     reg_date = NOW(),
//     perform_date = ? ,
//     checked = ?,
//     text = ? 
//     `,
//     [reg_date, perform_date, checked, text]
//   );
//   res.json({
//     msg: `할 일이 생성되었습니다.`,
//   });
// });

app.post('/todos', async (req, res) => {
  const {
    body: { text },
  } = req
  await pool.query(
    `
  INSERT INTO todo
  SET reg_date = NOW(),
  perform_date = NOW(),
  checked = 0,
  text = ?;
  `,
    [text]
  )
  const [[rows]] = await pool.query(`
  SELECT *
  FROM todo
  /* ORDER BY id
  DESC LIMIT 1 */
  `)
  res.json(rows)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});