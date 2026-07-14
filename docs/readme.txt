Before we touch React or Express, let's define what
we are building.
    Product Goal:
    | To provide schools with a secure, modern,
    | configurable platform that manages every aspect
    | of school operations.
    Every future feature should support that goal

    Our Development Phylosophy:
    Adopt these engineering principles:
    - Build for changes
        Never assume requirements won't changes
    - Security isn't a feature:
        It's part of every feature
    - Keep business logic on the server:
        The React app should display data and handle user 
        interaction, not enforce rules.
    - Every table needs an owner:
        Every table should answer:
        - Who created it?
        - When?
        - Who uploaded it?
        - when?
        Those details becom invaluable later.
    - Soft delete where it makes sense:
        Instead of deleting important records, mark them as 
        archived or inactive. Schools often need historical
        records.

    UI Phylosophy:
    The UI should feel like a software, not a website.
    Think: 
    - Fast
    - Clean
    - Consistent
    - Predictable
    A teacher shouldn't need a manual to record attendance.

    Coding Standard:
    one rule we'd follow throughout the project:
    | If future Ali opens this code in three years, 
    | he should understand it in minutes.
    That means:
    - clear names
    - small functions
    - comments explaining why when needed (not just what)
    - consistent structure
    

1. Tech Stack
    Frontend
    - React.js
    - React Router
    - Plain CSS
    - Axios
    - Socket.IO Client
    - Chart.js

    Backend
    - Node.js
    - Express.js
    - Socket.io 
    - JWT
    - bcrypt
    - multer
    - MySQL
    - Nodemailer
    - ExcelJS
    - PDFKit
    - docx
    - QRcode

    Database:
    - MySQL (raw SQL only)


2. Folder Structure:
    - client/ - React frontend source code
    - server/ - Node.js backend source code
    - database/ - SQL schema and migration files
    (Complete folder structure on my phone)


3. Development Rules:
These are our non-negotiables:
- No ORM
- ES Module
- Clean folder structure
- Reusable React components
- Plain CSS only
- Responsive from day one
- Accessibility compliance
- Security first
- Everything configurable where practical

4. Version 1 Modules
we'll build these in order:
    1. Authentication
    2. Dashboard
    3. Student Managment
    4. Teacher Managment
    5. Class Managment
    6. Subject MAnagment
    7. Attendance
    8. Exams
    9. Finance
    10. Messaging
    11. Notification
    12. Reports
    13. Settings


5. Git Strategy
From the very beginning use Git properly
    Example commits:
    - Initilize React Client
    - Create Express Server
    - Implement Authentication
    - Add student CRUD
    - Build dashboard UI
    Small meaningful commits make it easier to track changes and revert if needed.


*Note*:
    We are not going to rush. 
    
    There will be moments when we spend 
    an entire day designing a database table or refining a workflow.

    That's not wasted time.

    That's an investment in a product that should still be 
    maintainable and extensible years from now.


*Note*: From today onwards:
    | We do not write code that we do not understand
    If there is a package, function, or concept you do not 
    fully understand, we'll stop and discuss it before 
    moving on.

    We have to finish it understanding why every part exists.


*Note*: Every request from React will eventually follow this path:
    | Browser -> Express (app.js) -> Routes -> Controllers -> Services -> MySQL -> Response -> React


*Note*: We are going to standardize API responses.
    Instead of every controller inventing its own format, 
    we'll use a consistent Structure

    - Success:
    {
        "success": true,
        "message": "Student created successfully.",
        "data": {}
    }

    - Error:
    {
        "success": false,
        "message": "Invalid credentials.",
        "error": []
    }

    Whether it's authntication, attendance, or finanace, React will always know what to expect.