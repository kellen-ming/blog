#!/usr/bin/env node
/**
 * Script to automatically enhance frontmatter for blog posts
 * Usage: node scripts/enhance-frontmatter.js <path-to-post>
 * Example: node scripts/enhance-frontmatter.js src/content/posts/Webpack\ 深度学习指南/index.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping based on keywords
const CATEGORY_KEYWORDS = {
  前端: ["前端", "webpack", "vite", "rollup", "打包", "构建", "react", "vue", "javascript", "typescript", "css"],
  React: ["react", "react hooks", "react api"],
  资源: ["资源", "工具库", "收集", "推荐"],
  JS: ["javascript", "js api", "intersectionobserver"],
  CICD: ["npm", "package.json", "cicd"],
};

// Tag suggestions based on content
const TAG_KEYWORDS = {
  webpack: ["webpack", "打包工具", "构建工具"],
  react: ["react", "前端"],
  vite: ["vite", "打包工具", "前端"],
  typescript: ["typescript", "前端"],
  performance: ["性能优化", "前端"],
  practice: ["练习题", "实践案例"],
};

function extractChapters(content) {
  const chapterRegex = /^##\s+(.+)$/gm;
  const chapters = [];
  let match;
  while ((match = chapterRegex.exec(content)) !== null) {
    chapters.push(match[1]);
  }
  return chapters;
}

function extractKeywords(content) {
  const keywords = [];
  const lowerContent = content.toLowerCase();
  
  // Check for technology keywords
  Object.keys(TAG_KEYWORDS).forEach((key) => {
    if (lowerContent.includes(key)) {
      keywords.push(...TAG_KEYWORDS[key]);
    }
  });
  
  // Extract from title and first paragraph
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const title = titleMatch[1].toLowerCase();
    if (title.includes("webpack")) keywords.push("webpack", "打包工具");
    if (title.includes("react")) keywords.push("react", "前端");
    if (title.includes("练习") || title.includes("案例")) keywords.push("练习题", "实践案例");
    if (title.includes("进阶")) keywords.push("进阶");
    if (title.includes("深度学习") || title.includes("指南")) keywords.push("教程");
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

function determineCategory(title, content) {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword) || lowerContent.includes(keyword)) {
        return category;
      }
    }
  }
  
  return "前端"; // Default category
}

function generateDescription(title, chapters, content) {
  const firstParagraph = content.split("\n\n").find((p) => p.trim().length > 20) || "";
  
  // Extract key topics from chapters
  const topics = chapters.slice(0, 3).join("、");
  
  // Build description
  let desc = "";
  
  if (title.includes("指南") || title.includes("学习")) {
    desc = `${title}，`;
    if (topics) {
      desc += `涵盖${topics}等主题，`;
    }
    desc += "帮助你深入理解和掌握相关技术。";
  } else if (title.includes("练习") || title.includes("案例")) {
    desc = `${title}，包含详细的练习题和实践案例，通过动手实践帮助你巩固知识。`;
  } else if (title.includes("收集") || title.includes("资源")) {
    desc = `${title}，持续更新中。`;
  } else {
    desc = firstParagraph.substring(0, 100).replace(/\n/g, " ").trim();
    if (desc.length < 20) {
      desc = `${title}相关技术文章，深入解析核心概念和最佳实践。`;
    }
  }
  
  return desc.length > 150 ? desc.substring(0, 147) + "..." : desc;
}

function determineLanguage(content) {
  // Simple heuristic: if content contains Chinese characters, it's Chinese
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(content) ? "zh" : "en";
}

function enhanceFrontmatter(filePath) {
  try {
    const fullPath = path.resolve(__dirname, "..", filePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.error("No frontmatter found in file");
      return;
    }
    
    const frontmatter = frontmatterMatch[1];
    const body = content.substring(frontmatterMatch[0].length);
    
    // Extract title
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "";
    
    // Analyze content
    const chapters = extractChapters(body);
    const keywords = extractKeywords(body);
    const category = determineCategory(title, body);
    const description = generateDescription(title, chapters, body);
    const lang = determineLanguage(body);
    
    // Build new frontmatter
    const newFrontmatter = `---
title: ${title}
published: ${frontmatter.match(/^published:\s*(.+)$/m)?.[1]?.trim() || new Date().toISOString().split("T")[0]}
description: '${description}'
image: ${frontmatter.match(/^image:\s*(.+)$/m)?.[1]?.trim() || "''"}
tags: [${keywords.slice(0, 6).map((k) => `'${k}'`).join(", ")}]
category: '${category}'
draft: ${frontmatter.match(/^draft:\s*(.+)$/m)?.[1]?.trim() || "false"}
lang: '${lang}'
---`;
    
    // Write back
    const newContent = newFrontmatter + "\n" + body;
    fs.writeFileSync(fullPath, newContent, "utf-8");
    
    console.log("✅ Frontmatter enhanced successfully!");
    console.log(`📝 Description: ${description}`);
    console.log(`🏷️  Tags: ${keywords.slice(0, 6).join(", ")}`);
    console.log(`📁 Category: ${category}`);
    console.log(`🌐 Language: ${lang}`);
  } catch (error) {
    console.error("Error enhancing frontmatter:", error.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/enhance-frontmatter.js <path-to-post>");
  console.error('Example: node scripts/enhance-frontmatter.js "src/content/posts/Webpack 深度学习指南/index.md"');
  process.exit(1);
}

enhanceFrontmatter(args[0]);
