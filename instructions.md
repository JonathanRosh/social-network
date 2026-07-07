Home Assignment – Real-Time Social Network (Full-Stack)
Objective:
Build a web application that simulates a modern social network with authenticated
users, a friends-only social graph, posts with privacy rules, a personalized feed, and realtime updates. The focus is on system design, security, authorization, data integrity, and
code quality.
Required Technologies:
• Frontend: React (TypeScript recommended)
• Backend: Node.js + Express
• Database: Candidate’s choice (must be justified)
• Real-Time: WebSockets / Socket.IO
• Containerization: Docker + Docker Compose
Critical Requirement – Database Design:
The database schema is not provided. You must design it independently and submit an
ERD or schema diagram, along with a short explanation of your design decisions.
Authentication & Users:
• User registration, login, logout
• Secure session handling
• Password hashing
• Input validation
User Profiles:
• Public profile page
• Profile editing by owner only
Friends System:
• Send friend requests
• Accept or reject requests
• Cancel sent requests
• Remove friends
• Friendship is mutual (bidirectional)
• No duplicate relationships
Posts:
• Create,edit,delete posts
• Visibility levels: Public, Friends Only, Private
• Only authors may edit or delete posts
Personalized Feed:
• Displays the user’s posts
• Displays friends’ posts only
• Sorted by newest first
• Pagination or infinite scroll
Comments:
• Comment on friends posts
• Edit own comments
• Delete own comments
• Real-time updates
Real-Time Requirements:
• Live updates for posts
• Live updates for comments
• No duplicate events
• Correct ordering of events
Bonus – Private Messaging (Friends Only):
• One-to-one conversations
• Messaging allowed only between friends
• Message history with pagination
• Real-time message delivery
Docker:
• Entire system must be runnable via docker compose up
Submission:
• GitHub repository
• README including setup instructions
• Architecture overview
• Database design
Notes:
• A clean and well-explained partial solution is preferred over a rushed full
implementation
• Code must be clearly structured and thoroughly documented
