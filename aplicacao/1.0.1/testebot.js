
require('dotenv').config();
const axios = require('axios');
const dsleadnum = process.env.DSLEADNUM;


const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


// INTEGRAÇÃO PLUGA
const plugaIntegration = require('./plugaIntegration');

const accountSid = "AC8b88b3faa876a039956cd230105fd85f";
const authToken = "265109523508bb0eaa3c5d4d0280ff33";
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
    from: 'whatsapp:+14155238886',
    body: 'Hello there!',
    to: 'whatsapp:+15005550006'
  })
  .then(message => console.log(message.sid));
