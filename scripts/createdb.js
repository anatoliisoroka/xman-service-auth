#!/usr/bin/env node

//imports
//npm libraries
const pgtools = require('pgtools');

//env
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT || 5432),
    host: process.env.DB_HOST || 'localhost'
}

pgtools.createdb(config, process.env.DB_NAME, function (err, res) {

    if (err) {
        console.log(err.message);
        process.exit();
    }

    console.log(`Finished creating database ${process.env.DB_NAME}.`);
    process.exit();
  });