const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const expect = chai.expect;
chai.should();
chai.use(chaiHttp);

describe('Check App Status', function () {
    it('status', function (done) {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                (res).should.have.status(200);
                done();
            });
    });
});

describe('/POST login', () => {
    it('it should return token', (done) => {
        chai.request(server)
            .post('/api/enter')
            .send({ email: 'vaparth6@gmail.com'})
            .end((err, res) => {
                (res).should.have.status(200);
                (res.body).should.be.a('object');
                (res.body.token).should.be.a('string');
                done();
            });
    });
});

describe('/POST login without body', () => {
    it('it should return error', (done) => {
        chai.request(server)
            .post('/api/enter')
            .end((err, res) => {
                (res).should.have.status(400);
                expect(res.body.error).to.equal('Email required.');

                done();
            });
    });
});

describe('/GET balance', () => {
    it('it should return current balance', (done) => {
        chai.request(server)
            .get('/api/balance')
            .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoidmFwYXJ0aDZAZ21haWwuY29tIn0sImlhdCI6MTU3NzkwOTkyNCwiZXhwIjoxNTgwNTAxOTI0fQ.ije90Ovqi9Vd5ibnSwbio9f4hMkA2qW7Zb-ohoxsGQ8')
            .end((err, res) => {
                (res).should.have.status(200);
                (res.body.balance).should.be.a('number');
                done();
            });
    });
});

describe('/GET api/subscriptions', () => {
    it('it should GET all the subscription', (done) => {
        chai.request(server)
            .get('/api/subscriptions')
            .end((err, res) => {
                (res).should.have.status(200);
                (res.body).should.be.a('object');
                done();
            });
    });
});

describe('/GET subscriptions packs', () => {
    it('it should return array', (done) => {
        chai.request(server)
            .get('/api/subscriptions')
            .end((err, res) => {
                (res).should.have.status(200);
                (res.body.subscriptions.Packs).should.be.a('array');
                done();
            });
    });
});