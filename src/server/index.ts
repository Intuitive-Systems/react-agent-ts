import * as express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './schema';
import { config } from '../config';

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
}

const app = express();

app.use('/graphql', (req, res, next) => {
    try {
        graphqlHTTP({
            schema: schema,
            graphiql: true
        })(req, res);
    } catch (error) {
        next(error);
    }
});

app.use('/healthz', (req, res, next) => {
    try {
        res.status(200).send('OK');
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

app.listen(config.server_port, () =>
    console.log(`Now browse to localhost:${config.server_port}/graphql`)
);