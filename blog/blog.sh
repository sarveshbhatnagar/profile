#!/bin/bash

# Blog management script for Sarvesh Bhatnagar's Portfolio

BLOG_DIR="/Users/sarveshbhatnagar/Downloads/profile/blog"
MARKDOWN_DIR="$BLOG_DIR/markdown"
BUILD_SCRIPT="$BLOG_DIR/build_blog.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_help() {
    echo "Blog Management Script"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  new <filename>     Create a new markdown blog post"
    echo "  build              Build all markdown files to HTML"
    echo "  build <filename>   Build specific markdown file"
    echo "  list               List all markdown files"
    echo "  edit <filename>    Open markdown file in default editor"
    echo "  delete <filename>  Delete a blog post (markdown and HTML)"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 new my-new-post"
    echo "  $0 build"
    echo "  $0 build my-new-post"
    echo "  $0 edit understanding-yourself"
    echo "  $0 delete old-post"
}

create_new_post() {
    local filename="$1"
    if [ -z "$filename" ]; then
        echo -e "${RED}Error: Please provide a filename${NC}"
        echo "Usage: $0 new <filename>"
        exit 1
    fi
    
    # Remove .md extension if provided
    filename="${filename%.md}"
    
    local filepath="$MARKDOWN_DIR/${filename}.md"
    
    if [ -f "$filepath" ]; then
        echo -e "${YELLOW}Warning: File $filepath already exists${NC}"
        read -p "Do you want to overwrite it? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 0
        fi
    fi
    
    # Create template content
    local title=$(echo "$filename" | sed 's/-/ /g' | sed 's/\b\w/\u&/g')
    local date=$(date "+%B %d, %Y")
    
    cat > "$filepath" << EOF
---
title: $title
description: A blog post by Sarvesh Bhatnagar about $title
keywords: blog, thoughts, personal
date: $date
og_image: https://sarveshbhatnagar.com/images/user-3.jpg
og_url: https://sarveshbhatnagar.com/blog/${filename}.html
---

# $title

Write your blog post content here in Markdown format.

## Section Example

You can use:

- **Bold text**
- *Italic text*  
- [Links](https://example.com)
- Code blocks
- Lists
- And much more!

> This is a blockquote example

\`\`\`python
# Code example
def hello_world():
    print("Hello, World!")
\`\`\`

Your content goes here...
EOF
    
    echo -e "${GREEN}Created new blog post: $filepath${NC}"
    echo -e "${YELLOW}Edit the file and then run: $0 build ${filename}${NC}"
}

build_posts() {
    echo -e "${YELLOW}Building blog posts...${NC}"
    cd "$BLOG_DIR"
    
    if [ -n "$1" ]; then
        # Build specific file
        local filename="$1"
        filename="${filename%.md}"  # Remove .md if present
        local filepath="$MARKDOWN_DIR/${filename}.md"
        
        if [ ! -f "$filepath" ]; then
            echo -e "${RED}Error: File $filepath not found${NC}"
            exit 1
        fi
        
        python3 "$BUILD_SCRIPT" --file "$filepath"
    else
        # Build all files
        python3 "$BUILD_SCRIPT" --build-all
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Build completed successfully!${NC}"
    else
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
}

list_posts() {
    echo -e "${YELLOW}Markdown blog posts:${NC}"
    if [ -d "$MARKDOWN_DIR" ]; then
        for file in "$MARKDOWN_DIR"/*.md; do
            if [ -f "$file" ]; then
                basename="$(basename "$file" .md)"
                echo "  - $basename"
            fi
        done
    else
        echo "No markdown directory found."
    fi
    
    echo -e "\n${YELLOW}Generated HTML files:${NC}"
    for file in "$BLOG_DIR"/*.html; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "mainPage.html" ]; then
            basename="$(basename "$file" .html)"
            echo "  - $basename"
        fi
    done
}

edit_post() {
    local filename="$1"
    if [ -z "$filename" ]; then
        echo -e "${RED}Error: Please provide a filename${NC}"
        echo "Usage: $0 edit <filename>"
        exit 1
    fi
    
    filename="${filename%.md}"
    local filepath="$MARKDOWN_DIR/${filename}.md"
    
    if [ ! -f "$filepath" ]; then
        echo -e "${RED}Error: File $filepath not found${NC}"
        echo "Available files:"
        list_posts
        exit 1
    fi
    
    # Try to open with VS Code, otherwise use default editor
    if command -v code &> /dev/null; then
        code "$filepath"
    elif [ -n "$EDITOR" ]; then
        "$EDITOR" "$filepath"
    else
        open "$filepath"
    fi
}

delete_post() {
    local filename="$1"
    if [ -z "$filename" ]; then
        echo -e "${RED}Error: Please provide a filename${NC}"
        echo "Usage: $0 delete <filename>"
        exit 1
    fi
    
    # Remove .md extension if provided
    filename="${filename%.md}"
    
    local markdown_file="$MARKDOWN_DIR/${filename}.md"
    local html_file="$BLOG_DIR/${filename}.html"
    
    # Check if at least one file exists
    if [ ! -f "$markdown_file" ] && [ ! -f "$html_file" ]; then
        echo -e "${RED}Error: No files found for '$filename'${NC}"
        echo "Available files:"
        list_posts
        exit 1
    fi
    
    # Show what will be deleted
    echo -e "${YELLOW}Files to be deleted:${NC}"
    if [ -f "$markdown_file" ]; then
        echo "  - $markdown_file"
    fi
    if [ -f "$html_file" ]; then
        echo "  - $html_file"
    fi
    
    # Confirm deletion
    echo ""
    read -p "Are you sure you want to delete these files? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
    
    # Delete files
    local deleted_count=0
    if [ -f "$markdown_file" ]; then
        rm "$markdown_file"
        echo -e "${GREEN}Deleted: $markdown_file${NC}"
        deleted_count=$((deleted_count + 1))
    fi
    
    if [ -f "$html_file" ]; then
        rm "$html_file"
        echo -e "${GREEN}Deleted: $html_file${NC}"
        deleted_count=$((deleted_count + 1))
    fi
    
    if [ $deleted_count -gt 0 ]; then
        echo -e "${YELLOW}Updating blog list...${NC}"
        # Rebuild all to update the main page
        python3 "$BUILD_SCRIPT" --build-all > /dev/null 2>&1
        echo -e "${GREEN}Blog post '$filename' deleted successfully!${NC}"
        echo -e "${YELLOW}Main blog page updated.${NC}"
    fi
}

# Check if Python script exists
if [ ! -f "$BUILD_SCRIPT" ]; then
    echo -e "${RED}Error: Build script not found at $BUILD_SCRIPT${NC}"
    exit 1
fi

# Main command handling
case "$1" in
    "new")
        create_new_post "$2"
        ;;
    "build")
        build_posts "$2"
        ;;
    "list")
        list_posts
        ;;
    "edit")
        edit_post "$2"
        ;;
    "delete")
        delete_post "$2"
        ;;
    "help"|"--help"|"-h"|"")
        print_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        print_help
        exit 1
        ;;
esac
