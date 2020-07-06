const dummy = blogs => {
  return 1
}

const totalLikes = blogs => {
  const result = blogs.reduce((sum, blog) => sum + blog.likes, 0)
  //console.log('totalLikes result:', result)
  return result
}

const favoriteBlog = blogs => {
  const max =
    blogs.length === 0
      ? 'empty list'
      : blogs.reduce((max, blog) => (max.likes > blog.likes ? max : blog))

  const result =
    max === 'empty list'
      ? max
      : { title: max.title, author: max.author, likes: max.likes }

  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
}
