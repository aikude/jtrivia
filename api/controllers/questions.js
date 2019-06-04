const express = require('express');
const knex = require('knex');
const path = require('path');


var database = knex({
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '..', '..', 'database', 'db.sqlite')
    },
    useNullAsDefault: true
});

const router = express.Router();

router.get('/:id', (request, response) => {
    const id = parseInt(request.params.id || '0');
    
    database('questions').where({id: id}).first()
    .then(data => { return response.json(data); })
    .catch(err => {
        response.status(400).json('error_getting_question');
        console.log(err);
    });
    
});

router.get('/', (request, response) => {
    const batchNumber = parseInt(request.query.batch || '1');
    const batchSize = parseInt(request.query.batchsize || '100');
    const showAll = parseInt(request.query.all || '0');
    const sortCol = request.query.sort || 'id';
    const offset = batchSize*(batchNumber-1);
    
    const query = database('questions').orderBy(sortCol).offset(offset);
    if (!showAll) query.limit(batchSize);

    query
    .then(data => {
        if (data && data.constructor === Array && data.length > 0) return response.json(data);
        else response.status(404).json('no_users_found');
    })
    .catch(err => {
        response.status(400).json('error_getting_questions');
        console.log(err);
    });
    
});

module.exports = router;