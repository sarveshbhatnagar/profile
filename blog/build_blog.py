#!/usr/bin/env python3
"""
Blog Generator for Sarvesh Bhatnagar's Portfolio
Converts Markdown blog posts to HTML using a template
"""

import os
import re
import json
import yaml
from datetime import datetime
from pathlib import Path

try:
    import markdown
except ImportError:
    print("Installing required packages...")
    os.system("pip install markdown PyYAML")
    import markdown

class BlogGenerator:
    def __init__(self, blog_dir="/Users/sarveshbhatnagar/Downloads/profile/blog"):
        self.blog_dir = Path(blog_dir)
        self.markdown_dir = self.blog_dir / "markdown"
        self.templates_dir = self.blog_dir / "templates"
        self.template_file = self.templates_dir / "blog-template.html"
        
        # Ensure directories exist
        self.markdown_dir.mkdir(exist_ok=True)
        self.templates_dir.mkdir(exist_ok=True)
        
        # Load template
        if self.template_file.exists():
            with open(self.template_file, 'r', encoding='utf-8') as f:
                self.template = f.read()
        else:
            raise FileNotFoundError(f"Template file not found: {self.template_file}")

    def parse_frontmatter(self, content):
        """Parse YAML frontmatter from markdown content"""
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                try:
                    metadata = yaml.safe_load(parts[1])
                    markdown_content = parts[2].strip()
                    return metadata, markdown_content
                except yaml.YAMLError:
                    pass
        
        # No frontmatter found, return default metadata
        return {}, content

    def markdown_to_html(self, markdown_content):
        """Convert markdown content to HTML"""
        md = markdown.Markdown(
            extensions=[
                'fenced_code',
                'codehilite',
                'toc',
                'tables',
                'nl2br'
            ],
            extension_configs={
                'codehilite': {
                    'css_class': 'highlight',
                    'use_pygments': False
                }
            }
        )
        return md.convert(markdown_content)

    def generate_html(self, markdown_file):
        """Generate HTML from a markdown file"""
        with open(markdown_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse frontmatter
        metadata, markdown_content = self.parse_frontmatter(content)
        
        # Convert markdown to HTML
        html_content = self.markdown_to_html(markdown_content)
        
        # Get filename without extension
        filename = markdown_file.stem
        
        # Set default values
        title = metadata.get('title', filename.replace('-', ' ').title())
        description = metadata.get('description', f'A blog post by Sarvesh Bhatnagar about {title}')
        keywords = metadata.get('keywords', '')
        date = metadata.get('date', datetime.now().strftime('%B %d, %Y'))
        og_image = metadata.get('og_image', '')
        og_url = metadata.get('og_url', f'https://sarveshbhatnagar.com/blog/{filename}.html')
        
        # Replace placeholders in template
        html_output = self.template.replace('{{TITLE}}', title)
        html_output = html_output.replace('{{DESCRIPTION}}', description)
        html_output = html_output.replace('{{KEYWORDS}}', keywords)
        html_output = html_output.replace('{{DATE}}', date)
        html_output = html_output.replace('{{OG_IMAGE}}', og_image)
        html_output = html_output.replace('{{OG_URL}}', og_url)
        html_output = html_output.replace('{{CONTENT}}', html_content)
        
        return html_output, filename

    def generate_blog_list(self):
        """Generate updated blog list for mainPage.html"""
        blog_files = []
        
        # Scan for existing HTML files and markdown files
        for html_file in self.blog_dir.glob("*.html"):
            if html_file.name not in ['mainPage.html']:
                # Extract title from HTML file
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    title_match = re.search(r'<title>(.*?)</title>', content)
                    title = title_match.group(1) if title_match else html_file.stem
                    # Remove " - Sarvesh Bhatnagar" from title if present
                    title = title.replace(' - Sarvesh Bhatnagar', '')
                
                blog_files.append({
                    'filename': html_file.name,
                    'title': title,
                    'url': html_file.name
                })
        
        return blog_files

    def update_main_page(self, blog_files):
        """Update the main blog page with the list of posts"""
        main_page_file = self.blog_dir / "mainPage.html"
        
        if not main_page_file.exists():
            return
        
        with open(main_page_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Generate blog list HTML
        blog_list_html = ""
        for blog in sorted(blog_files, key=lambda x: x['title']):
            blog_list_html += f'                        <li><a href="{blog["url"]}">{blog["title"]}</a></li>\n'
        
        # Update the content between the div tags
        pattern = r'(<div>\s*(?:<!--.*?-->)?\s*)(.*?)(\s*</div>)'
        replacement = f'\\1\n{blog_list_html}                    \\3'
        
        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        with open(main_page_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

    def build_single(self, markdown_file):
        """Build a single markdown file"""
        if isinstance(markdown_file, str):
            markdown_file = Path(markdown_file)
        
        html_content, filename = self.generate_html(markdown_file)
        
        # Write HTML file
        output_file = self.blog_dir / f"{filename}.html"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Generated: {output_file}")
        return output_file

    def build_all(self):
        """Build all markdown files"""
        markdown_files = list(self.markdown_dir.glob("*.md"))
        
        if not markdown_files:
            print("No markdown files found in the markdown directory.")
            return
        
        built_files = []
        for md_file in markdown_files:
            try:
                output_file = self.build_single(md_file)
                built_files.append(output_file)
            except Exception as e:
                print(f"Error processing {md_file}: {e}")
        
        # Update main page with all blog posts
        blog_files = self.generate_blog_list()
        self.update_main_page(blog_files)
        
        print(f"Built {len(built_files)} blog posts and updated main page.")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate HTML blog posts from Markdown')
    parser.add_argument('--build-all', action='store_true', help='Build all markdown files')
    parser.add_argument('--file', help='Build specific markdown file')
    parser.add_argument('--blog-dir', default='/Users/sarveshbhatnagar/Downloads/profile/blog', 
                       help='Blog directory path')
    
    args = parser.parse_args()
    
    generator = BlogGenerator(args.blog_dir)
    
    if args.build_all:
        generator.build_all()
    elif args.file:
        if not Path(args.file).exists():
            print(f"File not found: {args.file}")
            return
        generator.build_single(args.file)
        # Update main page
        blog_files = generator.generate_blog_list()
        generator.update_main_page(blog_files)
    else:
        print("Use --build-all to build all markdown files or --file <path> to build a specific file")

if __name__ == "__main__":
    main()
