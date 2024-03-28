const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 8000;

const router = require('./routes/routes');
require('./db/conn')

app.use(express.json());
app.use(cors());
app.use(router);

app.listen(PORT, () => {
    console.log("Server Listening to PORT: ", PORT);
})