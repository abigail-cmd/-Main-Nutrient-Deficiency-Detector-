// db/database.js

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "data", "nutrition.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

function runQuery(query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT,
      age INTEGER,
      gender TEXT,
      weight REAL,
      height REAL,
      activityLevel TEXT,
      currentCalorieIntake REAL,
      bmi REAL,
      bmiCategory TEXT,
      bmr REAL,
      dailyCalories REAL,
      calorieRemark TEXT,
      calorieComparison TEXT,
      nutrientResults TEXT,
      scoringSummary TEXT,
      recommendationSummary TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await runQuery(createTableQuery);

    // Safe migration if the table already existed before fullName was added
    try {
      await runQuery(`ALTER TABLE assessments ADD COLUMN fullName TEXT`);
    } catch (error) {
      if (!String(error.message).includes("duplicate column name")) {
        throw error;
      }
    }

    console.log("Assessments table is ready.");
  } catch (error) {
    console.error("Error creating/updating assessments table:", error.message);
    throw error;
  }
}

function saveAssessment(data) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO assessments (
        fullName,
        age,
        gender,
        weight,
        height,
        activityLevel,
        currentCalorieIntake,
        bmi,
        bmiCategory,
        bmr,
        dailyCalories,
        calorieRemark,
        calorieComparison,
        nutrientResults,
        scoringSummary,
        recommendationSummary,
        createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Real form submissions never set data.createdAt, so this defaults to
    // right now — identical to relying on the column's DEFAULT. A seed
    // script can optionally pass a specific date to backdate test records.
    const createdAt = data.createdAt || new Date().toISOString();

    const values = [
      data.fullName,
      data.age,
      data.gender,
      data.weight,
      data.height,
      data.activityLevel,
      data.currentCalorieIntake,
      data.bmi,
      data.bmiCategory,
      data.bmr,
      data.dailyCalories,
      data.calorieRemark,
      JSON.stringify(data.calorieComparison || {}),
      JSON.stringify(data.nutrientResults || {}),
      JSON.stringify(data.scoringSummary || {}),
      JSON.stringify(data.recommendationSummary || {}),
      createdAt,
    ];

    db.run(query, values, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          message: "Assessment saved successfully.",
        });
      }
    });
  });
}

function getAllAssessments() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM assessments
      ORDER BY createdAt DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(parseAssessmentRow));
      }
    });
  });
}

function getAssessmentById(id) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM assessments
      WHERE id = ?
    `;

    db.get(query, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        resolve(parseAssessmentRow(row));
      }
    });
  });
}

function parseAssessmentRow(row) {
  return {
    ...row,
    calorieComparison: safeJSONParse(row.calorieComparison),
    nutrientResults: safeJSONParse(row.nutrientResults),
    scoringSummary: safeJSONParse(row.scoringSummary),
    recommendationSummary: safeJSONParse(row.recommendationSummary),
  };
}

function safeJSONParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function deleteAssessmentById(id) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM assessments WHERE id = ?`;

    db.run(query, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          deleted: this.changes > 0,
        });
      }
    });
  });
}






module.exports = {
  db,
  initializeDatabase,
  saveAssessment,
  getAllAssessments,
  getAssessmentById,
  deleteAssessmentById,
};

