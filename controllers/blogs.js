const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

/*const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7)
  }
  return null
}*/

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  if (blogs) {
    response.json(blogs.map(blog => blog.toJSON()))
  } else {
    response.send('<p>No saved posts yet</p>')
  }
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id).populate('user', {
    username: 1,
    name: 1,
  })

console.log(blog)

  if (blog) {
    response.json(blog.toJSON())
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  //const token = getTokenFrom(request)

  const token = request.token
  console.log('token:', token)

  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id).populate('user', {
    username: 1,
    name: 1,
  })

  console.log('user:', user)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user,
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  console.log('saved blog is:', savedBlog)

  response.json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)

  /*console.log('request.params is: ', request.params)

  const blogToRemove = await Blog.findById(request.params.id)
  console.log('blog to remove:', blogToRemove)

  const user = await User.findById(blogToRemove.user)
console.log('user is:', user)

  const removedBlog = await Blog.findByIdAndRemove(request.params.id)
  user.blogs = user.blogs.splice(request.params.id)
  
  await user.save()

  console.log('removed is:', removedBlog)*/

  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  const blog = {
    likes: body.likes,
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  })
  response.json(updatedBlog)
})

module.exports = blogsRouter
