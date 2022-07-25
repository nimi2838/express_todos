// app.js
import express from "express";
import mysql from "mysql2/promise";
import axios from "axios";

const app = express();

app.use(express.json());

const port = 3000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getData = async () => {
  const data = await axios.get("http://localhost:3000/todos");
  console.log("async await", data);
};

app.get("/todos/:id/:contentId", async (req, res) => {
  // params 여러개 받기
  const data = {
    todos: {
      id: req.params.id,
      contentId: req.params.contentId,
    },
  };

  const {
    todos: { id, contentId },
  } = data;

  console.log("id", id);
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");

  getData();
  res.json(rows);
});

app.get("/todos/:id/", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

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

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, content } = req.body;

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
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!content) {
    res.status(400).json({
      msg: "content required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE todo
    SET perform_date = ?,
    content = ?
    WHERE id = ?
    `,
    [perform_date, content, id]
  );

  res.json({
    msg: `${id}번 할일이 수정되었습니다.`,
  });
});

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
app.post("/todos", async (req, res) => {
  const { reg_date } = req.body;
  const { perform_date } = req.body;
  const { is_completed } = req.body;
  const { content } = req.body;

  const [rows] = await pool.query(`SELECT * FROM todo`);
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
  }
  if (!reg_date) {
    res.status(400).json({
      msg: "reg_date required",
    });
    return;
  }
  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }
  if (!is_completed) {
    res.status(400).json({
      msg: "is_completed required",
    });
    return;
  }
  if (!content) {
    res.status(400).json({
      msg: "content required",
    });
    return;
  }
  const [rs] = await pool.query(
    `
    INSERT todo SET
    reg_date = NOW(),
    perform_date = ? ,
    is_completed = ?,
    content = ? 
    `,
    [reg_date, perform_date, is_completed, content]
  );
  res.json({
    msg: `할 일이 생성되었습니다.`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});