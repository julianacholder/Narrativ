import { db } from './index';
import { user, posts, comments, postLikes } from './schema';


async function seed() {
  console.log('Seeding database...');

  // Create sample users first
  const [user1, user2, user3] = await db.insert(user).values([
    {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_2',
      name: 'Jane Smith', 
      email: 'jane@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'user_3',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]).returning();

  // Create sample blog posts
  const [post1, post2, post3] = await db.insert(posts).values([
    {
      id: 'post_1',
      title: 'Getting Started with React and TypeScript',
      excerpt: 'A comprehensive guide to building modern web applications with React and TypeScript. Learn best practices, common patterns, and how to set up your development environment for success.',
      content: 'React and TypeScript work amazingly well together. In this comprehensive guide, we\'ll explore how to set up a modern React application with TypeScript, covering everything from basic setup to advanced patterns...',
      category: 'Tech',
      authorId: user1.id,
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
      readTime: '5 min read',
      published: true,
    },
    {
      id: 'post_2', 
      title: 'The Art of Remote Work: Building Productive Habits',
      excerpt: 'Exploring the benefits and challenges of working remotely in today\'s digital world. Discover strategies for maintaining work-life balance and staying productive from home.',
      content: 'Remote work has become the new normal for millions of professionals worldwide. While it offers incredible flexibility and freedom, it also presents unique challenges...',
      category: 'Work',
      authorId: user2.id,
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=200&fit=crop',
      readTime: '7 min read',
      published: true,
    },
    {
      id: 'post_3',
      title: 'Mindful Living in a Digital Age',
      excerpt: 'How to maintain balance and mindfulness while staying connected in our digital world. Practical tips for digital detox and meaningful connection.',
      content: 'In our hyperconnected world, mindfulness is more important than ever. This article explores practical strategies for maintaining mental well-being...',
      category: 'Lifestyle',
      authorId: user3.id,
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=200&fit=crop',
      readTime: '4 min read',
      published: true,
    },
    {
      id: 'post_4',
      title: 'JavaScript Performance Optimization Techniques',
      excerpt: 'Learn advanced techniques to optimize your JavaScript applications for better performance and user experience.',
      content: 'Performance optimization is crucial for modern web applications. In this deep dive, we\'ll explore various techniques to make your JavaScript code faster and more efficient...',
      category: 'Tech',
      authorId: user1.id,
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=200&fit=crop',
      readTime: '8 min read',
      published: true,
    },
    {
      id: 'post_5',
      title: 'Building Sustainable Travel Habits',
      excerpt: 'Explore eco-friendly travel options and learn how to reduce your carbon footprint while exploring the world.',
      content: 'Sustainable travel is not just a trend—it\'s a responsibility. Learn how to explore the world while minimizing your environmental impact...',
      category: 'Travel',
      authorId: user2.id,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=200&fit=crop',
      readTime: '6 min read',
      published: true,
    }
  ]).returning();

  // Add some sample comments
  await db.insert(comments).values([
    {
      id: 'comment_1',
      content: 'Great article! This really helped me understand TypeScript better.',
      postId: post1.id,
      authorId: user2.id,
    },
    {
      id: 'comment_2',
      content: 'Thanks for sharing these remote work tips. The productivity section was especially helpful.',
      postId: post2.id,
      authorId: user3.id,
    },
    {
      id: 'comment_3',
      content: 'I\'ve been struggling with work-life balance while working from home. This gives me some good strategies to try.',
      postId: post2.id,
      authorId: user1.id,
    }
  ]);

  // Add some sample likes
  await db.insert(postLikes).values([
    {
      id: 'like_1',
      postId: post1.id,
      userId: user2.id,
    },
    {
      id: 'like_2',
      postId: post1.id,
      userId: user3.id,
    },
    {
      id: 'like_3',
      postId: post2.id,
      userId: user1.id,
    },
    {
      id: 'like_4',
      postId: post3.id,
      userId: user1.id,
    },
    {
      id: 'like_5',
      postId: post3.id,
      userId: user2.id,
    }
  ]);

  console.log('Database seeded successfully!');
  console.log('Created:');
  console.log('  - 3 users');
  console.log('  - 5 blog posts');  
  console.log('  - 3 comments');
  console.log('  - 5 likes');
}

seed().catch((error) => {
  console.error(' Seeding failed:', error);
  process.exit(1);
});