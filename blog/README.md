# Blog System for Sarvesh Bhatnagar's Portfolio

This blog system allows you to write blog posts in Markdown and automatically convert them to HTML with your site's styling.

## Quick Start

### 1. Create a new blog post
```bash
./blog.sh new my-awesome-post
```

### 2. Edit the markdown file
```bash
./blog.sh edit my-awesome-post
```

### 3. Build the HTML
```bash
./blog.sh build my-awesome-post
```

### 4. Build all posts at once
```bash
./blog.sh build
```

## Directory Structure

```
blog/
├── markdown/           # Your markdown files go here
│   └── *.md           # Markdown blog posts
├── templates/         # HTML templates
│   └── blog-template.html
├── build_blog.py      # Python build script
├── blog.sh           # Shell script for easy management
└── README.md         # This file
```

## Writing Blog Posts

### Frontmatter (Optional)
Add metadata to the top of your markdown files:

```yaml
---
title: My Blog Post Title
description: A short description for SEO and social media
keywords: keyword1, keyword2, keyword3
date: December 25, 2023
og_image: https://sarveshbhatnagar.com/images/my-image.jpg
og_url: https://sarveshbhatnagar.com/blog/my-post.html
---
```

### Markdown Content
Write your content using standard Markdown:

```markdown
# Main Title

## Section Title

This is a paragraph with **bold text** and *italic text*.

> This is a blockquote

- List item 1
- List item 2
- List item 3

[This is a link](https://example.com)

\`\`\`python
# Code block
def hello():
    print("Hello, World!")
\`\`\`
```

## Available Commands

| Command | Description |
|---------|-------------|
| `./blog.sh new <filename>` | Create a new markdown blog post |
| `./blog.sh edit <filename>` | Open markdown file in editor |
| `./blog.sh build` | Build all markdown files |
| `./blog.sh build <filename>` | Build specific file |
| `./blog.sh list` | List all blog posts |
| `./blog.sh delete <filename>` | Delete a blog post (markdown and HTML) |
| `./blog.sh help` | Show help message |

## Features

- ✅ Markdown to HTML conversion
- ✅ YAML frontmatter support
- ✅ Automatic blog list generation
- ✅ SEO-friendly meta tags
- ✅ Social media Open Graph tags
- ✅ Code syntax highlighting
- ✅ Responsive design
- ✅ Consistent styling with your main site

## Installation

The system will automatically install required Python packages (`markdown` and `PyYAML`) when first run.

## Workflow

1. **Write**: Create and edit markdown files in the `markdown/` directory
2. **Build**: Run the build script to generate HTML files
3. **Deploy**: Commit and push to your GitHub repository
4. **Automatic**: The main blog page will automatically list all your posts

## Example Workflow

```bash
# Create a new post
./blog.sh new understanding-life

# Edit it (opens in VS Code if available)
./blog.sh edit understanding-life

# Build just this post
./blog.sh build understanding-life

# Or build everything
./blog.sh build

# List all posts
./blog.sh list

# Delete a post (with confirmation)
./blog.sh delete old-post
```

## Tips

- Use descriptive filenames (they become URLs): `my-great-idea` becomes `my-great-idea.html`
- Add frontmatter for better SEO and social media sharing
- The system automatically updates your main blog page (`mainPage.html`)
- Images should be placed in the main `images/` directory and referenced as `../images/filename.jpg`

## Troubleshooting

If you encounter issues:

1. Make sure Python 3 is installed
2. Check that the markdown directory exists
3. Ensure the template file is in place
4. Run `./blog.sh help` for command syntax

Now you can write in Markdown and never touch HTML again! 🎉
