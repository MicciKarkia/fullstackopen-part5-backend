const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')

let token

const testUserData = {
    username: 'root',
    password: 'sekret'
}

beforeEach(async () => {
    await User.deleteMany({})

    const { username, password } = testUserData

    const passwordHash = await bcrypt.hash(password, 10)
    const user = new User({ username, passwordHash })

    await user.save()

    const loginRequest = await api
        .post('/api/login')
        .send({ username, password })

    token = loginRequest.body.token

    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map(blog => new Blog({ ...blog, user: user.id }))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})


describe('addition of a new blog post', () => {

    test('fails without token', async () => {
        const newBlog = {
            title: 'Here is how to add a post',
            author: 'Fidel Kajander',
            url: 'fidel.me',
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)

        const blogsAtEnd = await helper.blogsInDb()
        console.log('blogsAtEnd after added a post', blogsAtEnd)
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    })

    test('succeeds with valid data', async () => {
        const newBlog = {
            title: 'Here is how to add a post',
            author: 'Fidel Kajander',
            url: 'fidel.me',
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .set({ Authorization: `Bearer ${token}` })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        console.log('blogsAtEnd after added a post', blogsAtEnd)
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const authors = blogsAtEnd.map(b => b.author)
        expect(authors).toContain('Fidel Kajander')
    })

    test('fails with status code 400 if data is invalid', async () => {
        const newBlog = {
            title: 'Here is how to not add a post',
            url: 'fidel.me',
        }

        await api
            .post('/api/blogs')
            .set({ Authorization: `Bearer ${token}` })
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

})

afterAll(() => {
    mongoose.connection.close()
})
  