# 📊 Project File Guide & Architecture Map

Quick reference for understanding each file's role in the system.

---

## 🗂️ Complete Directory Tree with Descriptions

```
Secure Chat Room/
│
├── 📄 package.json
│   │ What: Node.js project configuration
│   │ Size: 20 lines
│   │ Role: Defines dependencies & scripts
│   │ Key Dependencies:
│   │   • express: Web framework
│   │   • socket.io: Real-time messaging
│   │   • mongoose: MongoDB connection
│   │   • ejs: Template engine
│   │   • uuid: Generate room IDs
│   │   • crypto: Built-in encryption
│   │ Run: npm install
│   │
│
├── 📄 server.js [⭐ START HERE]
│   │ What: Main Express server with Socket.io
│   │ Size: 370+ lines (well-commented)
│   │ Key Sections:
│   │   • Lines 1-50: Imports and setup
│   │   • Lines 60-100: Middleware configuration
│   │   • Lines 110-140: Database connection
│   │   • Lines 150-190: Socket.io connection
│   │   • Lines 195-320: Socket events (join, message, typing, etc.)
│   │   • Lines 330-370: Error handling & startup
│   │
│   │ What It Does:
│   │   1. Creates Express.js HTTP server
│   │   2. Initializes Socket.io for real-time
│   │   3. Connects to MongoDB
│   │   4. Handles room creation/joining
│   │   5. Receives plaintext messages from clients
│   │   6. ✅ ENCRYPTS messages with room key
│   │   7. Saves encrypted to database
│   │   8. Broadcasts to room members
│   │
│   │ Critical Events:
│   │   • connection: User connects
│   │   • join-room: User joins chat room
│   │   • send-message: User sends message ← ENCRYPTION HAPPENS HERE
│   │   • receive-message: Broadcast encrypted message to clients
│   │   • disconnect: User leaves
│   │
│   │ Security: Server-side encryption of all messages
│   │ Must read: YES - Core of entire system
│   │
│
├── 📄 .env.example
│   │ What: Environment variables template
│   │ Size: 20 lines
│   │ How to use:
│   │   1. Copy to .env
│   │   2. Fill in your values
│   │   3. Never commit .env to git
│   │
│   │ Variables:
│   │   • PORT: Server port (default: 3000)
│   │   • MONGODB_URI: Database connection string
│   │   • NODE_ENV: development or production
│   │
│
├── 📄 .gitignore
│   │ What: Git ignore patterns
│   │ Size: 40 lines
│   │ Excludes: node_modules, .env, logs, etc.
│   │
│
├── 📄 README.md
│   │ What: Complete project documentation
│   │ Size: 800+ lines
│   │ Sections:
│   │   • Project overview
│   │   • Features list
│   │   • Installation steps
│   │   • Usage guide
│   │   • Security architecture
│   │   • Database schemas
│   │   • Troubleshooting
│   │   • FAQ
│   │
│   │ Must read: YES - After getting it running
│   │
│
├── 📄 QUICKSTART.md
│   │ What: 5-minute setup and test guide
│   │ Size: 300+ lines
│   │ Best for: Getting it running quickly
│   │ Includes:
│   │   • Step-by-step installation
│   │   • Quick tests to verify it works
│   │   • Common issues and fixes
│   │   • Pro tips
│   │
│   │ Must read: YES - Read this first!
│   │
│
├── 📄 ENCRYPTION_ARCHITECTURE.md
│   │ What: Deep technical dive into encryption
│   │ Size: 560+ lines
│   │ For: Understanding how cryptography works
│   │ Covers:
│   │   • AES-256-GCM algorithm details
│   │   • Key management explanation
│   │   • Threat modeling with examples
│   │   • Known vulnerabilities
│   │   • Production improvements
│   │   • Code templates for hardening
│   │
│   │ Must read: YES - If doing CNS project
│   │
│
├── 📄 PROJECT_SUMMARY.md
│   │ What: High-level project overview
│   │ Size: 400+ lines
│   │ Best for: Understanding what you have
│   │ Contains:
│   │   • Feature checklist
│   │   • Code statistics
│   │   • Learning outcomes
│   │   • Extension ideas
│   │   • Usage recommendations
│   │
│
├── 📂 models/
│   │ What: MongoDB database schemas
│   │ Role: Define data structure
│   │
│   ├── 📄 Room.js
│   │   │ What: Schema for chat rooms
│   │   │ Size: 60 lines
│   │   │ Fields:
│   │   │   • roomId: Unique room identifier (UUID, 8 chars)
│   │   │   • roomName: Human-readable name
│   │   │   • creator: Username who created room
│   │   │   • users[]: List of users in room
│   │   │   • maxUsers: Max users allowed (3-5)
│   │   │   • createdAt: Timestamp
│   │   │   • isActive: Room still exists?
│   │   │   • keyHash: OPTIONAL hash of key (not plaintext!)
│   │   │
│   │   │ ⚠️ IMPORTANT: Encryption key NOT stored here!
│   │   │   Key is stored only in server memory
│   │   │   This prevents database breach = key exposure
│   │
│   ├── 📄 Message.js
│   │   │ What: Schema for encrypted messages
│   │   │ Size: 80 lines
│   │   │ Fields:
│   │   │   • roomId: Which room (index for queries)
│   │   │   • sender: Username who sent
│   │   │   • receiver: Recipient (null = group message)
│   │   │   • encryptedText: AES-256-GCM ciphertext (format: iv:tag:data)
│   │   │   • isPrivate: Is this private message?
│   │   │   • messageType: 'group' or 'private'
│   │   │   • timestamp: When sent
│   │   │   • readBy: Who read it
│   │   │
│   │   │ ✅ SECURITY: Only encrypted text stored!
│   │   │   No plaintext in database = safe from DB breach
│   │
│
├── 📂 routes/
│   │ What: Express.js route handlers
│   │ Role: HTTP endpoints for browser
│   │
│   ├── 📄 rooms.js [⭐ IMPORTANT]
│   │   │ What: All room-related HTTP routes
│   │   │ Size: 200+ lines
│   │   │ Routes:
│   │   │
│   │   │   1. GET / - Show home page
│   │   │      Returns: home.ejs with create/join form
│   │   │
│   │   │   2. POST /create-room
│   │   │      Input: {roomName, username}
│   │   │      Process:
│   │   │        • Generate unique roomId
│   │   │        • ✅ Generate encryption key
│   │   │        • ✅ Store key in memory
│   │   │        • Save room metadata to MongoDB
│   │   │      Output: {roomId, success message}
│   │   │
│   │   │   3. POST /join-room
│   │   │      Input: {roomId, username}
│   │   │      Process:
│   │   │        • Find room in database
│   │   │        • Check not full
│   │   │        • Add user to room
│   │   │        • ✅ Retrieve key from memory
│   │   │        • ✅ Send key to user
│   │   │      Output: {encryptionKey in hex format}
│   │   │      ⚠️ NOTE: Key sent in plaintext (fix with HTTPS + ECDH)
│   │   │
│   │   │   4. GET /room/:roomId
│   │   │      Shows: Chat interface
│   │   │      Loads: Message history for decryption
│   │   │
│   │   │   5. POST /room/:roomId/delete
│   │   │      Deletes: Room and its key
│   │   │
│   │   │   6. GET /api/stats
│   │   │      Returns: Key statistics (for demo)
│   │   │
│   │   │ Key Security Points:
│   │   │   ✅ Keys generated fresh per room
│   │   │   ✅ Keys stored only in memory
│   │   │   ✅ Keys not in database
│   │   │   ✅ Only hex string sent to client
│   │   │   ✅ Room creator can delete
│   │
│
├── 📂 utils/
│   │ What: Utility functions for encryption
│   │ Role: Core cryptographic operations
│   │
│   ├── 📄 encryption.js [⭐⭐ CRITICAL]
│   │   │ What: All AES-256-GCM encryption logic + bonus ECDH
│   │   │ Size: 270+ lines (50+ detailed comments)
│   │   │
│   │   │ Key Functions:
│   │   │
│   │   │   1. generateEncryptionKey()
│   │   │      Returns: 256-bit random buffer
│   │   │      Uses: crypto.randomBytes(32)
│   │   │      Security: Cryptographically secure
│   │   │      Called: When room is created
│   │   │
│   │   │   2. storeRoomKey(roomId, key)
│   │   │      Stores: Key in memory
│   │   │      Structure: activeKeys[roomId] = Buffer
│   │   │      Scope: Server memory only
│   │   │      Lifetime: Until server restart or room deleted
│   │   │
│   │   │   3. getRoomKey(roomId) ← USED BY SERVER
│   │   │      Returns: Encryption key from memory
│   │   │      Or: null if room/key not found
│   │   │      Uses: Server retrieves for encryption
│   │   │
│   │   │   4. encryptMessage(plaintext, key) ← USED BY SERVER
│   │   │      Input: "Hello Bob" + key
│   │   │      Process:
│   │   │        a. Generate random 128-bit IV
│   │   │        b. Create AES-256-GCM cipher
│   │   │        c. Encrypt plaintext
│   │   │        d. Generate authentication tag (128-bit)
│   │   │        e. Combine: IV:AuthTag:Ciphertext (hex)
│   │   │      Output: "a1b2c3:d4e5f6:g7h8i9..."
│   │   │      Called: server.js on 'send-message' event
│   │   │      Security: ✅✅✅ Military-grade
│   │   │
│   │   │   5. decryptMessage(encryptedData, key) ← USED BY SERVER
│   │   │      Input: "a1b2c3:..." + key
│   │   │      Process:
│   │   │        a. Parse IV, AuthTag, Ciphertext
│   │   │        b. Create AES-256-GCM decipher
│   │   │        c. Set authentication tag
│   │   │        d. Decrypt and verify
│   │   │      Output: "Hello Bob" or error
│   │   │      Security: ✅ Fails if tampered
│   │   │
│   │   │   6. deleteRoomKey(roomId)
│   │   │      Action: Remove key from memory
│   │   │      Called: When room deleted
│   │   │
│   │   │   7. getKeyStats()
│   │   │      Returns: Active rooms with keys
│   │   │      Used: For /api/stats debugging
│   │   │
│   │   │ BONUS - Advanced ECDH Functions:
│   │   │
│   │   │   8. generateECDHKeyPair()
│   │   │      What: Elliptic Curve DH keypair
│   │   │      For: Secure key exchange
│   │   │      Returns: {privateKey, publicKey}
│   │   │      Usage: See ENCRYPTION_ARCHITECTURE.md
│   │   │
│   │   │   9. computeECDHSharedSecret(private, publicKey)
│   │   │      What: Compute shared secret
│   │   │      For: Derive encryption key securely
│   │   │      Security: ✅ Key never transmitted!
│   │   │
│   │   │ Security Comments:
│   │   │   • Explains WHY each step matters
│   │   │   • Lists limitations (for learning)
│   │   │   • Suggestions for improvement (for production)
│   │   │   • Format of encrypted data (for understanding)
│   │   │
│   │   │ Must read: YES - This is the crypto core!
│   │
│
├── 📂 views/
│   │ What: EJS template files (HTML + JavaScript)
│   │ Role: Frontend user interface
│   │
│   ├── 📄 home.ejs [⭐ START WITH THIS]
│   │   │ What: Create and join room interface
│   │   │ Size: 400+ lines (HTML + CSS + JavaScript)
│   │   │ Sections:
│   │   │
│   │   │   1. Create Room Form
│   │   │      <form id="createRoomForm">
│   │   │        • Username input
│   │   │        • Room name input
│   │   │      POST /create-room
│   │   │      Response: {roomId}
│   │   │      Show: Room ID with copy button
│   │   │      Action: Redirect to chatroom
│   │   │
│   │   │   2. Join Room Form
│   │   │      <form id="joinRoomForm">
│   │   │        • Username input
│   │   │        • Room ID input (8 chars)
│   │   │      POST /join-room
│   │   │      Response: {encryptionKey}
│   │   │      Store: Key in sessionStorage
│   │   │      Action: Redirect to chatroom
│   │   │
│   │   │   3. Security Info Section
│   │   │      Shows: Features & benefits
│   │   │      Explains: Why system is secure
│   │   │
│   │   │ JavaScript:
│   │   │   • Form validation
│   │   │   • Error handling
│   │   │   • Loading states
│   │   │   • Copy to clipboard
│   │
│   ├── 📄 chatroom.ejs [⭐⭐ MAIN INTERFACE]
│   │   │ What: Real-time chat interface
│   │   │ Size: 600+ lines (HTML + CSS + JavaScript)
│   │   │ Layout:
│   │   │
│   │   │   ┌─────────────────┬──────────────────────┐
│   │   │   │    SIDEBAR      │     CHAT AREA        │
│   │   │   │  (280px)        │  (flex, responsive)  │
│   │   │   ├─────────────────┼──────────────────────┤
│   │   │   │ Room Name       │ Room Header          │
│   │   │   │ Room ID         │ Message History      │
│   │   │   │ Online Users    │ Input Area           │
│   │   │   │ Key Info        │ Message Type Select  │
│   │   │   │ Leave Room      │                      │
│   │   │   └─────────────────┴──────────────────────┘
│   │   │
│   │   │ Key Features:
│   │   │
│   │   │   1. Message Display
│   │   │      Shows: Decrypted messages by default
│   │   │      Toggle: "Show Encrypted" button
│   │   │      Format: Sent (right) / Received (left)
│   │   │      Badge: Shows 🔒 Encrypted status
│   │   │
│   │   │   2. Encryption Status
│   │   │      View both:
│   │   │        • Plaintext (readable)
│   │   │        • Ciphertext (encrypted format)
│   │   │      Educational: See what encryption looks like
│   │   │      Verify: Message integrity
│   │   │
│   │   │   3. Message Types
│   │   │      Group Message: 📢 Broadcast to all
│   │   │      Private Message: 🔒 Only recipient
│   │   │      Select: Dropdown menu with user list
│   │   │
│   │   │   4. Client-Side Decryption
│   │   │      Receives: Encrypted message + key
│   │   │      Uses: Web Crypto API (SubtleCrypto)
│   │   │      Algorithm: AES-GCM (browser native)
│   │   │      Decrypts: In browser (client-side security)
│   │   │      Displays: Plaintext to user
│   │   │
│   │   │ JavaScript Functions (Critical):
│   │   │
│   │   │   decryptMessageClient(encryptedData)
│   │   │     • Runs in browser
│   │   │     • Uses Web Crypto API
│   │   │     • Mirrors server-side decryption
│   │   │     • Provides privacy (decryption local)
│   │   │
│   │   │   loadEncryptionKey(keyHex)
│   │   │     • Loads key from sessionStorage
│   │   │     • Converts hex to buffer
│   │   │     • Imports as Web Crypto key
│   │   │     • Decrypts existing messages
│   │   │
│   │   │ Socket.io Events:
│   │   │   • join-room: Send user/room info
│   │   │   • send-message: Send plaintext to server
│   │   │   • receive-message: Get encrypted from server
│   │   │   • user-joined: System message
│   │   │   • user-left: System message
│   │   │   • user-typing: Typing indicator
│   │   │
│   │   │ Real-time Features:
│   │   │   ✅ Instant message delivery
│   │   │   ✅ User online/offline status
│   │   │   ✅ Typing indicators
│   │   │   ✅ System notifications
│   │   │   ✅ Automatic scroll to latest
│   │   │
│   │   │ Must read: YES - See decryption logic
│   │
│   ├── 📄 error.ejs
│   │   │ What: Error page template
│   │   │ Displays: Error message
│   │   │ Used: When something fails
│   │
│   └── 📄 404.ejs
│       │ What: Not found page
│       │ Displays: Room not found message
│       │ Used: Invalid room ID
│
├── 📂 public/
│   │ What: Static assets
│   │ Role: CSS styling
│   │
│   └── 📄 style.css [⭐ MODERN UI]
│       │ What: Complete styling for entire app
│       │ Size: 900+ lines
│       │ Features:
│       │   • Dark mode design (AES-256 themed)
│       │   • Responsive layout (mobile-friendly)
│       │   • Smooth animations
│       │   • BEM naming convention
│       │   • CSS custom properties (variables)
│       │   • Accessibility features
│       │
│       │ Sections:
│       │   1. Design System (colors, shadows, radius)
│       │   2. Typography (fonts, sizes)
│       │   3. Common Elements (buttons, alerts, badges)
│       │   4. Forms (inputs, validation)
│       │   5. Home Page (layout, cards)
│       │   6. Chat Room (sidebar, messages, input)
│       │   7. Modals (popups, overlays)
│       │   8. Error Pages
│       │   9. Responsive Queries (@media)
│       │   10. Scrollbars & Printing
│       │
│       │ Design Philosophy:
│       │   ✅ Modern dark theme
│       │   ✅ Clear visual hierarchy
│       │   ✅ Accessibility-focused
│       │   ✅ Mobile-responsive
│       │   ✅ No external libraries
│       │   ✅ Pure CSS + Grid/Flexbox
│       │
│       │ Color Scheme:
│       │   • Primary: Indigo (#6366f1)
│       │   • Secondary: Purple (#8b5cf6)
│       │   • Success: Green (#10b981)
│       │   • Danger: Red (#ef4444)
│       │   • Dark background suitable for encryption theme
│
```

---

## 🔄 Data Flow Diagram

```
REQUEST FLOW - User Creating Room
═══════════════════════════════════

1. Browser: Click "Create Room"
   └─→ Fills form (username, roomName)
   └─→ POST /create-room

2. Server (routes/rooms.js):
   ├─→ Parse request body
   ├─→ Generate roomId (UUID)
   └─→ Call: generateEncryptionKey() 🔐

3. Utils (utils/encryption.js):
   ├─→ crypto.randomBytes(32)
   ├─→ Returns: 256-bit key buffer
   └─→ Uses: Cryptographically secure random

4. Server (routes/rooms.js):
   ├─→ Call: storeRoomKey(roomId, key)
   ├─→ Save to memory: activeKeys[roomId]
   ├─→ Create Room document
   ├─→ Save to MongoDB
   └─→ Return: {roomId} to client

5. Browser:
   ├─→ Receive roomId
   ├─→ Display Room ID
   ├─→ Show "Room Created" message
   └─→ Offer to enter room

6. User clicks "Enter Room":
   ├─→ POST /join-room
   ├─→ Body: {roomId, username}

7. Server (routes/rooms.js):
   ├─→ Find room
   ├─→ Call: getRoomKey(roomId) 🔐
   ├─→ Retrieve from memory
   ├─→ Convert to hex string
   └─→ Return: {encryptionKey: hex}

8. Browser:
   └─→ sessionStorage.encryptionKey = hex
   └─→ Ready for decryption!

9. Redirect:
   └─→ GET /room/roomId?username=Alice
   └─→ Load chatroom.ejs


MESSAGE FLOW - Sending Encrypted Message
═════════════════════════════════════════

1. Browser: User types "Hello Bob"
   └─→ Select "Group Message" or "Private: Bob"
   └─→ Click Send

2. JavaScript (chatroom.ejs):
   └─→ socket.emit('send-message', {
       roomId, sender, message, receiver
     })

3. Server (server.js):
   ├─→ socket.on('send-message', ...)
   ├─→ Get room key: getRoomKey(roomId) 🔐
   ├─→ Call: encryptMessage(plaintext, key) 🔐

4. Utils (utils/encryption.js) - ENCRYPTION:
   ├─→ Generate random 128-bit IV
   ├─→ Create AES-256-GCM cipher
   ├─→ Encrypt "Hello Bob"
   ├─→ Get authentication tag (128-bit)
   └─→ Return: "iv_hex:tag_hex:ciphertext_hex"

5. Server (server.js):
   ├─→ Create Message document
   ├─→ Save encryptedText to MongoDB
   ├─→ Identify recipient sockets:
   │   ├─→ If group: broadcast to room
   │   └─→ If private: send to sender + recipient only
   └─→ socket.to(roomId).emit('receive-message', {
       encryptedText, isPrivate, ...
     })

6. Browser:
   ├─→ socket.on('receive-message', ...)
   ├─→ If private: server sent decrypted already
   ├─→ If group: call decryptMessageClient(encryptedText)

7. JavaScript (chatroom.ejs) - DECRYPTION:
   ├─→ Parse: iv:tag:ciphertext
   ├─→ Convert hex to buffers
   ├─→ Import key from sessionStorage
   ├─→ Use Web Crypto API: crypto.subtle.decrypt()
   ├─→ Verify: authentication tag
   └─→ Return: "Hello Bob" (plaintext)

8. Display:
   └─→ Show message in chat with status
       "🔒 Encrypted [Show Encrypted]"

9. User clicks "Show Encrypted":
   └─→ Toggle display of ciphertext
   └─→ Show: "iv_hex:tag_hex:ciphertext_hex"


DATABASE FLOW - Persistence
════════════════════════════

1. MongoDB Collections:

   rooms:
   ├─→ roomId: "ABC12345"
   ├─→ roomName: "Team Chat"
   ├─→ creator: "alice"
   ├─→ users: [{username: "alice"}, {username: "bob"}]
   ├─→ maxUsers: 5
   ├─→ createdAt: 2024-04-15T12:34:56Z
   ├─→ isActive: true
   └─→ ⚠️ NO encryption key! (safety)

   messages:
   ├─→ roomId: "ABC12345"
   ├─→ sender: "alice"
   ├─→ receiver: null (group) or "bob" (private)
   ├─→ encryptedText: "a1b2c3d4e5f6:g7h8i9j0k1l2:..."
   ├─→ isPrivate: false
   ├─→ messageType: "group"
   └─→ timestamp: 2024-04-15T12:34:57Z

2. Query Examples:

   Get all messages in room ABC12345:
     db.messages.find({roomId: "ABC12345"})
     Returns: Encrypted messages only

   Get private messages for bob:
     db.messages.find({
       roomId: "ABC12345",
       receiver: "bob"
     })
     Returns: Only encrypted messages between alice & bob

   ⚠️ Attacker stealing database:
     Has encrypted messages
     Does NOT have keys (keys = server memory)
     Messages still SECURE!
```

---

## 📊 Function Call Hierarchy

```
INITIALIZATION
══════════════

server.js main
├── mongoose.connect(MONGODB_URI)
│   └── MongoDB Database Connection
│
├── io.on('connection', socket => {
│   ├── socket.on('join-room')
│   │   └── socket.join(roomId)
│   │
│   ├── socket.on('send-message')
│   │   ├── getRoomKey(roomId)
│   │   │   └── activeKeys[roomId] = <Buffer>
│   │   │
│   │   ├── encryptMessage(plaintext, key)
│   │   │   ├── crypto.randomBytes(16) - IV
│   │   │   ├── crypto.createCipheriv('aes-256-gcm', key, iv)
│   │   │   ├── cipher.update(plaintext, 'utf8', 'hex')
│   │   │   ├── cipher.final('hex')
│   │   │   └── cipher.getAuthTag()
│   │   │
│   │   ├── Message.create({...})
│   │   │   └── MongoDB Save
│   │   │
│   │   └── io.to(roomId).emit('receive-message', encrypted)
│   │
│   └── socket.on('disconnect')
│       └── Cleanup
│
└── server.listen(PORT)


REQUEST FLOW
════════════

app.use() - Middleware
├── express.json()
├── express.urlencoded()
├── view engine = 'ejs'
└── static('public')

app.use('/', routes)
├── GET / → home.ejs
│   └── <form> create & join forms
│
├── POST /create-room
│   ├── generateEncryptionKey()
│   ├── storeRoomKey()
│   └── Room.create()
│
├── POST /join-room
│   ├── Room.findOne()
│   ├── getRoomKey()
│   └── Returns {encryptionKey}
│
└── GET /room/:roomId
    ├── Room.findOne()
    └── Message.find()
        └── chatroom.ejs


ENCRYPTION PIPELINE
════════════════════

User Input (plaintext)
  ↓
Socket.io: 'send-message'
  ↓
Server receives: {roomId, sender, message, receiver}
  ↓
1. getRoomKey(roomId)
   └── Retrieve from activeKeys
  ↓
2. encryptMessage(plaintext, key)
   ├── Generate random IV
   ├── AES-256-GCM encrypt
   └── Get auth tag
  ↓
3. Message.create({encryptedText: ...})
   └── Save to MongoDB (NO plaintext)
  ↓
4. socket.to(roomId).emit()
   └── Broadcast encrypted to room
  ↓
5. Client receives: {encryptedText}
  ↓
6. Browser: decryptMessageClient()
   ├── Parse: iv:tag:ciphertext
   ├── Verify: auth tag
   └── Decrypt: AES-GCM
  ↓
7. Display: plaintext message
```

---

## 🔑 Key Security Points

### Where Keys Are Generated

```
routes/rooms.js:post('/create-room')
└── Call: generateEncryptionKey()
    └── utils/encryption.js line ~35
        └── crypto.randomBytes(32)
            └── Cryptographically secure ✅
```

### Where Keys Are Stored

```
Server Memory:
  utils/encryption.js:
    const activeKeys = {} ← Global variable
    activeKeys[roomId] = Buffer ← 256-bit key
    
  Lifetime: Until server restart
  Scope: Server only
  Security: ✅ Not in database
```

### Where Keys Are Used

```
1. Encryption (Server):
   server.js:socket.on('send-message')
   └── encryptMessage(plaintext, key) ← server-side

2. Distribution:
   routes/rooms.js:post('/join-room')
   └── Send as hex string to client ← ⚠️ plaintext

3. Decryption (Client):
   chatroom.ejs:decryptMessageClient()
   └── Uses Web Crypto API ← browser-side
```

---

## 📈 Message Lifecycle

```
CREATION
─────────
1. Browser: Type "Hello Bob"
   └── In memory (not sent yet)

SENDING
────────
2. Browser: Click Send
   └── socket.emit('send-message', {plaintext})
        ⚠️ Socket.io sends plaintext (HTTP) to server

ENCRYPTION
──────────
3. Server receives: 'send-message' event
   └── Call: encryptMessage(plaintext, key)
       └── Returns: "iv:tag:ciphertext"
           ✅ Plaintext never stored or broadcasted again

STORAGE
────────
4. Server: Message.create({encryptedText: ...})
   └── MongoDB: Save encrypted only
       ✅ Database hack = messages still safe

BROADCAST
──────────
5. Server: io.to(roomId).emit('receive-message', {encrypted})
   └── Send encrypted to all in room
       ⚠️ Socket.io sends encrypted (HTTP) to clients

RECEPTION
──────────
6. Clients: socket.on('receive-message', {encrypted})
   └── Receive encrypted text + key
       ✅ Key stored in sessionStorage

DECRYPTION
──────────
7. Client: decryptMessageClient(encrypted)
   └── Browser: Web Crypto API decrypt
       └── Returns: plaintext "Hello Bob"
           ✅ Decryption happens locally (private)

DISPLAY
────────
8. Browser: Show plaintext in chat
   └── Message visible to user
       ✅ Can toggle to see "Show Encrypted" anytime

PERSISTENCE
────────────
9. User closes browser
   └── Plaintext gone from memory
       └── sessionStorage cleared
           ✅ Only encrypted in database
```

---

## 🎯 Quick File Reference

| Need | File | Line |
|------|------|------|
| Understand encryption | `utils/encryption.js` | 1-50 |
| See encryptMessage() | `utils/encryption.js` | 100-140 |
| See decryptMessage() | `utils/encryption.js` | 150-180 |
| Create room flow | `routes/rooms.js` | 30-80 |
| Join room flow | `routes/rooms.js` | 90-150 |
| Send message (server) | `server.js` | 140-220 |
| Receive message (client) | `chatroom.ejs` | 250-300 |
| Decrypt (client) | `chatroom.ejs` | 180-240 |
| Message storage | `models/Message.js` | Full |
| Room storage | `models/Room.js` | Full |
| UI Layout | `chatroom.ejs` | 1-100 |
| Styling | `public/style.css` | All |
| Setup steps | `QUICKSTART.md` | Full |
| Security details | `ENCRYPTION_ARCHITECTURE.md` | Full |

---

## 🚀 Execution Flow

```
START
 │
 ├─→ npm install ← Install dependencies
 │
 ├─→ node server.js ← Start server
 │    │
 │    ├─→ Connect to MongoDB
 │    ├─→ Initialize Express app
 │    ├─→ Setup Socket.io
 │    ├─→ Define routes
 │    └─→ Listen on port 3000
 │
 ├─→ Browser: http://localhost:3000
 │    │
 │    ├─→ GET / ← Load home.ejs
 │    ├─→ Render: Create/Join forms
 │    └─→ Ready for user input
 │
 ├─→ Create Room
 │    │
 │    ├─→ POST /create-room
 │    ├─→ Generate room key
 │    ├─→ Save to database
 │    └─→ Return room ID
 │
 ├─→ Join Room
 │    │
 │    ├─→ POST /join-room
 │    ├─→ Get room key
 │    ├─→ Redirect to chatroom
 │    └─→ Load chatroom.ejs
 │
 ├─→ Socket Connection
 │    │
 │    ├─→ Browser: socket.io.js connects
 │    ├─→ Server: socket.on('connection')
 │    ├─→ Client: socket.emit('join-room')
 │    └─→ Server: Add to room
 │
 ├─→ Message Loop
 │    │
 │    ├─→ User sends message
 │    ├─→ encryptMessage() ← SERVER
 │    ├─→ Save to DB (encrypted)
 │    ├─→ Broadcast to room (encrypted)
 │    ├─→ Client receives (encrypted)
 │    ├─→ decryptMessageClient() ← CLIENT
 │    └─→ Display (plaintext)
 │
 └─→ RUNNING ← Ready for multiple users!
```

---

## 🎓 Reading Order

**For Complete Understanding:**

1. **QUICKSTART.md** (15 min) - Get it running
2. **This file** (20 min) - Understand structure  
3. **server.js** (30 min) - Core logic
4. **utils/encryption.js** (30 min) - Cryptography
5. **chatroom.ejs** (20 min) - Client-side decryption
6. **ENCRYPTION_ARCHITECTURE.md** (60 min) - Deep dive
7. **README.md** (30 min) - Full reference

**Total: ~3 hours to master the system**

---

*This guide maps the entire codebase. Use it to navigate and understand the architecture!* 🗺️

