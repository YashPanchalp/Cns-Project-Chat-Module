# 🚀 Quick Start Guide

Get the Secure Chat Room running in 5 minutes!

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
cd "Secure Chat Room"
npm install
```

Takes about 1-2 minutes. Installs:
- Express.js
- Socket.io
- Mongoose
- EJS
- crypto (built-in Node.js)

### 2️⃣ Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows - Download from https://www.mongodb.com/try/download/community

# Linux (Ubuntu)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster
4. Get connection string
5. Copy into `.env` file

### 3️⃣ Create Environment File

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your MongoDB URI
# If using local MongoDB, you can leave default:
# MONGODB_URI=mongodb://localhost:27017/secure-chat
```

### 4️⃣ Start the Server

```bash
npm start
```

You should see:
```
✓ Connected to MongoDB
✓ Server running on: http://localhost:3000
✓ WebSocket ready for real-time messaging
```

### 5️⃣ Open in Browser

1. Go to http://localhost:3000
2. Create a room or join existing one
3. Test encryption by sending a message
4. Click "Show Encrypted" to see encrypted format!

---

## 🧪 Quick Test

### Test #1: Create a Room

```
1. Enter username: "Alice"
2. Enter room name: "Test Chat"
3. Click "Create Room"
4. Copy Room ID (e.g., ABC12345)
```

### Test #2: Join with Another Browser

```
1. Open new browser/tab
2. Go to http://localhost:3000
3. Enter username: "Bob"
4. Paste Room ID from Test #1
5. Click "Join Room"
```

### Test #3: Send Encrypted Message

```
1. In Alice's browser: Type "Hello Bob!"
2. Send message
3. See message in both browsers (decrypted)
4. Click "Show Encrypted" to see encrypted version
```

### Test #4: Private Message

```
1. In Alice's browser: Select "Bob" from dropdown
2. Type "Secret message"
3. Send
4. Only Alice and Bob see decrypted message
5. Other users see encrypted only
```

---

## ✅ Verification Checklist

After starting the server, check:

- [ ] Server logs show "✓ Connected to MongoDB"
- [ ] Can open http://localhost:3000 in browser
- [ ] Can create a room
- [ ] Can join a room with different username
- [ ] Can send and receive messages in real-time
- [ ] Can see encrypted text format
- [ ] Can toggle encrypted/decrypted view
- [ ] Private messages work correctly

---

## 🔧 Common Issues & Fixes

### "Cannot connect to MongoDB"

```bash
# Check MongoDB is running
mongod --version

# Start MongoDB
mongo  # Type: exit to quit

# Verify MONGODB_URI in .env
```

### "Port 3000 is already in use"

```bash
# Use different port
PORT=3001 npm start

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Messages not encrypting/decrypting

```bash
# Check browser console for errors
# Open Dev Tools: F12
# Check Console tab for JS errors
# Check Network tab for Socket.io connection
```

---

## 📊 Project Structure

```
Secure Chat Room/
├── server.js             ← Main file (run this!)
├── package.json          ← Dependencies
├── .env                  ← Your configuration
│
├── models/
│   ├── Room.js          ← Room database schema
│   └── Message.js       ← Message database schema
│
├── routes/
│   └── rooms.js         ← Express routes
│
├── utils/
│   └── encryption.js    ← AES-256 encryption logic
│
├── views/
│   ├── home.ejs         ← Create/Join page
│   └── chatroom.ejs     ← Chat interface
│
└── public/
    └── style.css        ← Styling
```

---

## 🔐 Understanding the Encryption

### What Happens When You Send a Message?

1. **You type:** `"Hello Bob"`
2. **Server encrypts:**
   ```
   Input: "Hello Bob"
   Key: [256-bit random key for this room]
   Algorithm: AES-256-GCM
   IV: [random 128-bit value for this message]
   Output: "a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8..."
   ```
3. **Database stores:** Only the encrypted version
4. **Browser receives:** The encrypted message
5. **Client decrypts:** Using the stored key
6. **You see:** `"Hello Bob"` (decrypted)

### Encrypted Format: `iv:authTag:encryptedData`

- **IV** (Initialization Vector): Random 128-bit value - makes same message encrypt differently each time
- **AuthTag** (Authentication Tag): Proves message wasn't modified
- **EncryptedData** (Ciphertext): The actual encrypted message

### Why This is Secure?

✅ **256-bit key** → 2^256 possible keys (impossible to brute force)  
✅ **Random IV** → Same message encrypts differently each time  
✅ **Auth Tag** → Detects if anyone modifies the message  
✅ **GCM Mode** → Encryption + Authentication in one operation  

---

## 🧠 Key Concepts

### Room Encryption Key

- **Generated:** Once when room is created
- **Stored:** In server memory (not database)
- **Shared:** When new user joins
- **Used for:** All messages in that room
- **Lost:** On server restart (acceptable for demo)

### Private Messages

- Encrypted with same room key
- Only sender and recipient can decrypt
- Other users see encrypted blob only
- Server identifies recipient by username

### Security Trade-offs

| Feature | Demo | Production |
|---------|------|-----------|
| Key Storage | Memory | AWS KMS |
| Key Distribution | Plaintext | ECDH Exchange |
| Authentication | None | JWT |
| Transport | HTTP | HTTPS/TLS |
| Key Rotation | Manual | Automatic |

---

## 📖 Want to Learn More?

### Read the Code Comments

Every file has detailed comments explaining:
- **Why** each decision was made
- **How** encryption works
- **What** the security implications are

Files to read:
1. `utils/encryption.js` - Core encryption logic
2. `server.js` - Real-time messaging
3. `views/chatroom.ejs` - Client-side decryption

### Advanced Topics (in Code)

See bonus section in `utils/encryption.js`:
- ECDH Key Exchange implementation
- How to improve security for production

---

## 🚀 Next Steps

### Beginner
1. Get it running
2. Create rooms and send messages
3. Examine encrypted formats
4. Read code comments

### Intermediate
1. Modify message format
2. Add logging
3. Change encryption algorithm
4. Experiment with key sizes

### Advanced
1. Implement ECDH key exchange
2. Add user authentication (JWT)
3. Deploy to cloud (Heroku, AWS)
4. Add message compression
5. Implement key rotation

---

## 💡 Pro Tips

1. **Use Chrome DevTools** to inspect Socket.io messages
   - F12 → Network → WS → Messages tab

2. **Inspect MongoDB** with MongoDB Compass
   - See actual stored encrypted data
   - Verify keys aren't stored

3. **Test with Multiple Tabs**
   - Open separate browser tabs for different users
   - Or use incognito/private mode

4. **Check Encryption in Console**
   ```javascript
   // In browser console
   sessionStorage.getItem('encryptionKey')
   // Shows: Your 64-character hex key
   ```

---

## 🎓 Educational Value

This project demonstrates:

✅ **Cryptography**
- AES-256-GCM encryption
- Key generation and management
- Message authentication

✅ **Web Architecture**
- Real-time communication (Socket.io)
- RESTful API design
- Database schema design

✅ **Full-Stack Development**
- Backend: Node.js + Express
- Frontend: EJS + Vanilla JS
- Database: MongoDB

✅ **Security Best Practices**
- Never store plaintext keys in database
- Use authenticated encryption
- Validate all inputs
- Secure key distribution

---

## 📞 Quick Help

**Can't connect to database?**
→ Check MongoDB is running: `mongod`

**Getting encryption errors?**
→ Check browser console: F12 → Console tab

**Messages not appearing?**
→ Check Socket.io connection: F12 → Network → WS

**Server won't start?**
→ Try different port: `PORT=3001 npm start`

---

**You're all set! 🎉 Happy encrypting! 🔒**

For detailed information, see README.md
