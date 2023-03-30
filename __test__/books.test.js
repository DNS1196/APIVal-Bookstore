process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

describe("Book Routes Test", function () {
    let testBook;
    let testBook2;

    beforeEach(async function () {
        await db.query("DELETE FROM books");

        testBook = await Book.create({
            isbn: "0691161518",
            amazon_url:
                "http://a.co/eobPtX2",
            author: "Matthew Lane",
            language: "english",
            pages: 264,
            publisher: "Princeton University Press",
            title: "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            year: 2017,
        });

        testBook2 = await Book.create({
            isbn: "0691161526",
            amazon_url:
                "http://a.co/eobPtX3",
            author: "Matthew Lane",
            language: "english",
            pages: 400,
            publisher: "Princeton University Press",
            title: "Math Goes to the Movies",
            year: 2012,
        });
    });
    afterAll(async function () {
        await db.end()
    });

    describe("GET /books", function () {
        test("Gets a list of 2 books", async function () {
            const response = await request(app).get("/books");
            const books = response.body.books;
            expect(response.statusCode).toBe(200);
            expect(books).toHaveLength(2);
            expect(books[1].isbn).toEqual(testBook.isbn);
            expect(books[0].isbn).toEqual(testBook2.isbn);
        });
    });

    describe("GET /books/:isbn", function () {
        test("Gets a single book", async function () {
            const response = await request(app).get(`/books/${testBook.isbn}`);
            expect(response.statusCode).toBe(200);
            expect(response.body.book.isbn).toEqual(testBook.isbn);
        });

        test("Responds with a 404 if book is not found", async function () {
            const response = await request(app).get(`/books/999`);
            expect(response.statusCode).toBe(404);
        });
    });

    describe("POST /books", function () {
        test("Creates a new book", async function () {
            const response = await request(app).post("/books").send({
                isbn: "1234567890",
                amazon_url: "http://a.co/eobPtX1",
                author: "Test Author",
                language: "english",
                pages: 100,
                publisher: "Test Publisher",
                title: "Test Book",
                year: 2022,
            });
            expect(response.statusCode).toBe(201);
            expect(response.body.book.isbn).toEqual("1234567890");
        });

        test("Responds with a 400 if request body is invalid", async function () {
            const response = await request(app).post("/books").send({
                isbn: "1234567890",
                amazon_url: "http://a.co/eobPtX1",
                author: "Test Author",
                language: "english",
                pages: "invalid",
                publisher: "Test Publisher",
                title: "Test Book",
                year: "invalid",
            });
            expect(response.statusCode).toBe(400);
        });
    });

    describe("PUT /books/:isbn", function () {
        test("Updates a single book", async function () {
            const response = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                    isbn: "0691161518",
                    amazon_url: "http://a.co/eobPtX2",
                    author: "Yuval Noah Harari",
                    language: "english",
                    pages: 512,
                    publisher: "Harper",
                    title: "Sapiens: A Brief History of Humankind",
                    year: 2015,
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.book).toEqual({
                isbn: "0691161518",
                amazon_url: "http://a.co/eobPtX2",
                author: "Yuval Noah Harari",
                language: "english",
                pages: 512,
                publisher: "Harper",
                title: "Sapiens: A Brief History of Humankind",
                year: 2015,
            });
        });

        test("Prevents a bad book update", async function () {
            const response = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                    isbn: "0691161518",
                    amazon_url: "http://a.co/eobPtX2",
                    author: "Yuval Noah Harari",
                    language: "english",
                    pages: "not-a-number",
                    publisher: "Harper",
                    title: "Sapiens: A Brief History of Humankind",
                    year: 2015,
                });
            expect(response.statusCode).toBe(400);
        });

        test("Responds with a 404 if it cannot find the book in question", async function () {
            // delete the test book to ensure it doesn't exist
            await request(app).delete(`/books/${testBook.isbn}`);

            const response = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                    isbn: "0691161518",
                    amazon_url: "http://a.co/eobPtX2",
                    author: "Yuval Noah Harari",
                    language: "english",
                    pages: 512,
                    publisher: "Harper",
                    title: "Sapiens: A Brief History of Humankind",
                    year: 2015,
                });
            expect(response.statusCode).toBe(404);
        });
    });


    describe("DELETE /books/:isbn", function () {
        test("Deletes a single book", async function () {
            const response = await request(app)
                .delete(`/books/${testBook.isbn}`);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: "Book deleted" });
        });

        test("Responds with 404 if book not found", async function () {
            const response = await request(app)
                .delete(`/books/999`)
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toEqual({ message: `There is no book with an isbn '999`, status: 404 });
        });
    });
})