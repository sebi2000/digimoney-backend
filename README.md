# CryptoExchange Backend

## Environment variables
  - Add your Stripe API keys

## Answering Questions
  - You can see all the unanswered questions posted by the users by going to localhost:1234/forum-answer
  - There, you'll see the question's body and id
  - To answer a question, take note of the question's id and use a URL encoder (such as https://www.urlencoder.org/) to get the URL encoded version of the answer (ex.: 'Answer text...' will become 'Anser%20text...')
  - Finally, go to localhost:1234/forum-answer?id={QuestionID}&answer={URL encoded answer}
  - Ex: localhost:1234/forum-answer?id=64877770b6643e1a2d0dceb2&answer=Anser%20text... 

## Debug
  - If you get any errors related to the got library, make sure the version is 10.4.0 : npm i got@10.4.0
