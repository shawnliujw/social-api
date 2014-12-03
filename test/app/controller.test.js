/**
 * Created by Shawn Liu on 2014/12/3.
 */
var expect = require("chai").expect;
var sinon = require("sinon");
var request = require('supertest');
var app = require("../../app");

describe("Test app/controller.js", function () {

    it("#registration()", function (done) {
        this.timeout(30000);
        request(app)
            .post("/api/social/twitter.com")
            .send({
                "accounts": [{
                    "email": "test@g.com"
                }]
            })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                console.log(res.body);
                if (err) return done(err);
                expect(res.body).to.be.ok;
                done();
            });
    });
});
