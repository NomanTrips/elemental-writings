const express = require('express');
const fs = require('fs');
const path = require('path');
const fm = require('front-matter');
const MarkdownIt = require('markdown-it');
const chokidar = require('chokidar');
const compression = require('compression');

const app = express();
const md = new MarkdownIt();

const PORT = process.env.PORT || 3000;

let posts = [];

const contentDir = path.join(__dirname, 'content');

// Function to load posts from markdown files
function loadPosts() {
  posts = [];
  const files = fs.readdirSync(contentDir);
  files.forEach(file => {
    if (path.extname(file) === '.md') {
      const filePath = path.join(contentDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = fm(content);
      const metadata = parsed.attributes;
      metadata.content = parsed.body;
      metadata.slug = metadata.slug || slugify(metadata.title);
      metadata.htmlContent = md.render(parsed.body);
      posts.push(metadata);
    }
  });
  // Sort posts by start date descending
  posts.sort((a, b) => new Date(b['start date']) - new Date(a['start date']));
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// Initial load of posts
loadPosts();

// Watch for changes in the content directory
chokidar.watch(contentDir).on('all', (event, path) => {
  console.log(`Content directory changed: ${event} ${path}`);
  loadPosts();
});

// Enable compression for performance
app.use(compression());

// Serve static files from public directory
app.use(
  express.static('public', {
    maxAge: '1d',
    etag: false
  })
);

// API Endpoints
app.get('/posts', (req, res) => {
  res.json(
    posts.map(post => ({
      title: post.title,
      slug: post.slug,
      'start date': post['start date'],
      'end date': post['end date'] || 'in-progress'
    }))
  );
});

app.get('/posts/latest', (req, res) => {
  res.json(
    posts.slice(0, 5).map(post => ({
      title: post.title,
      slug: post.slug,
      'start date': post['start date'],
      'end date': post['end date'] || 'in-progress'
    }))
  );
});

app.get('/posts/:slug', (req, res) => {
  const slug = req.params.slug;
  const post = posts.find(p => p.slug === slug);
  if (post) {
    res.json({
      title: post.title,
      slug: post.slug,
      'start date': post['start date'],
      'end date': post['end date'] || 'in-progress',
      content: post.content,
      htmlContent: post.htmlContent
    });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /');
});

// HTML Pages
app.get('/', (req, res) => {
  let html = generateIndexPage(posts);
  res.send(html);
});

app.get('/post/:slug', (req, res) => {
  const slug = req.params.slug;
  const post = posts.find(p => p.slug === slug);
  if (post) {
    let html = generatePostPage(post);
    res.send(html);
  } else {
    res.status(404).send('<h1>404 - Post Not Found</h1>');
  }
});

// Helper functions to generate HTML
function generateIndexPage(posts) {
  let postList = posts
    .map(
      post => `
        <li>
            <a href="/post/${post.slug}">${post.title}</a>
            <span>${post['start date']}</span>
        </li>
    `
    )
    .join('');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Elemental Writings</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>Elemental Writings</h1>
    <ul>
        ${postList}
    </ul>
    <script src="/script.js"></script>
</body>
</html>
    `;
}

function generatePostPage(post) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${post.title}</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>${post.title}</h1>
    <div>${post.htmlContent}</div>
    <a href="/">Back to home</a>
    <script src="/script.js"></script>
</body>
</html>
    `;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});