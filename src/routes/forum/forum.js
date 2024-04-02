// Dependencies
const express = require("express");

// Middleware
const isAuth = require("../../middleware/isAuth");

// MongoDB models
const Question = require("../../models/question");
// ----------------------------------------------

const server = express()

server.use(express.json())

// Get all unanswered questions or answer a question
server.get('/forum-answer', isAuth, async (req, res) => {
    if (req.query.id && req.query.answer) { // If we want to answer a question
        await Question.findOneAndUpdate(
            { // Filter
                "_id" : req.query.id
            },
            { // Update
                "answer" : req.query.answer
            }
        );

        return res.status(200).json(
            {
                msg: "Answered"
            }
        );
    } else { // If we want to get all unanswered questions
        let questions = await Question.find(
            {
                "answer" : { $exists: true, $eq: "" }
            }
        );

        let returnData = [];

        for (let i = 0; i < questions.length; i++) {
            returnData.push(
                {
                    question: questions[i].question,
                    id: questions[i]._id,
                }
            );
        }

        return res.status(200).json(
            {
                returnData
            }
        );
    }
});

// Get all questions
server.get('/forum', isAuth, async (req, res) => {
    let questions = await Question.find(
        {
            // "answer" : { $exists: true, $ne: "" }
        }
    );

    let returnData = [];

    for (let i = 0; i < questions.length; i++) {
        returnData.push(
            {
                question: questions[i].question,
                answer: questions[i].answer,
            }
        );
    }

    return res.status(200).json(
        {
            returnData
        }
    );
});

// Post a question to be answered
server.post('/forum', isAuth, async (req, res) =>{
    const { question } = req.body;

    if (question !== "") {
        await Question.create(
            {
                question: question,
            }
        );
    }

    return res.status(200).json(
        {
            msg: "Question added"
        }
    );
});

module.exports = server
