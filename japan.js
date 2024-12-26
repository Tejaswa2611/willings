// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        db.run(`CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      making_time TEXT NOT NULL,
      serves TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      cost TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    }
});

// Routes
// POST /recipes -> Create a recipe
app.post('/recipes', (req, res) => {
    const { title, making_time, serves, ingredients, cost } = req.body;

    if (!title || !making_time || !serves || !ingredients || !cost) {
        return res.status(400).json({
            message: "Recipe creation failed!",
            required: "title, making_time, serves, ingredients, cost"
        });
    }

    db.run(
        `INSERT INTO recipes (title, making_time, serves, ingredients, cost) VALUES (?, ?, ?, ?, ?)`,
        [title, making_time, serves, ingredients, cost],
        function (err) {
            if (err) {
                return res.status(500).json({ message: "Internal Server Error" });
            }

            db.get(`SELECT * FROM recipes WHERE id = ?`, [this.lastID], (err, row) => {
                if (err) {
                    return res.status(500).json({ message: "Internal Server Error" });
                }

                res.status(201).json({
                    message: "Recipe successfully created!",
                    recipe: [row]
                });
            });
        }
    );
});

// GET /recipes -> Return the list of all recipes
app.get('/recipes', (req, res) => {
    db.all(`SELECT * FROM recipes`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
        res.status(200).json({ recipes: rows });
    });
});

// GET /recipes/:id -> Return the selected recipe
app.get('/recipes/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM recipes WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
        if (!row) {
            return res.status(404).json({ message: "No recipe found" });
        }
        res.status(200).json({
            message: "Recipe details by id",
            recipe: [row]
        });
    });
});

// PATCH /recipes/:id -> Update the selected recipe
app.patch('/recipes/:id', (req, res) => {
    const { id } = req.params;
    const { title, making_time, serves, ingredients, cost } = req.body;

    db.run(
        `UPDATE recipes SET title = COALESCE(?, title), making_time = COALESCE(?, making_time),
    serves = COALESCE(?, serves), ingredients = COALESCE(?, ingredients), cost = COALESCE(?, cost),
    updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [title, making_time, serves, ingredients, cost, id],
        function (err) {
            if (err) {
                return res.status(500).json({ message: "Internal Server Error" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "No recipe found" });
            }

            db.get(`SELECT * FROM recipes WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                res.status(200).json({
                    message: "Recipe successfully updated!",
                    recipe: [row]
                });
            });
        }
    );
});

// DELETE /recipes/:id -> Delete the selected recipe
app.delete('/recipes/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM recipes WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "No recipe found" });
        }
        res.status(200).json({ message: "Recipe successfully removed!" });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
