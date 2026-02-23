# E-voting (A Blockchain-Based Voting System)

A secure, hybrid voting platform that combines traditional backend authentication with blockchain-based vote integrity.

This system is designed for institutional use cases such as:
- College elections
- Community polls
- Organizational voting

It intentionally avoids unrealistic "fully decentralized" claims and instead focuses on practical, secure architecture.

---

## Core Design

> **Backend handles identity.  
> Blockchain handles integrity.**

The system separates responsibilities:

**Backend** : Authentication, roles, election metadata 

**Blockchain** : Vote recording, immutability, enforcement 

**Frontend** : User interaction layer 

This hybrid approach ensures:
- Recoverable login system
- Administrative control
- Cryptographic vote immutability
- Transparent vote counting

---

## 🏗 Architecture Overview

### 🔐 Backend (FastAPI + MongoDB)

Responsible for:
- User authentication (JWT)
- Role management (Admin / Voter)
- Election metadata
- Candidate metadata
- Election lifecycle (draft → active → closed)

**Important:**  
Votes are NOT stored in MongoDB.

---

###  Blockchain (Solidity + Hardhat)

Responsible for:
- One wallet = one vote enforcement
- Immutable vote counting
- Election activation control
- Public vote verification

The smart contract does NOT store:
- Usernames
- Emails
- Descriptions
- Candidate bios

Only vote logic lives on-chain.

---

### 💻 Frontend (React + Vite + Tailwind)

Provides:
- Login / Registration
- Admin Dashboard
- Election Management UI
- Candidate Management UI
- Voter Election View
- Wallet integration (via MetaMask)

---

## 🧩 Tech Stack

### Backend
- FastAPI
- MongoDB
- JWT Authentication
- Pydantic

### Frontend
- React (Vite)
- TailwindCSS
- Ethers.js

### Blockchain
- Solidity
- Hardhat
- MetaMask (Used for blockchain wallet)
- Ganache(Local Blockchain)

---

## Hybrid Strategy

Existing blockchain voting system use a traditional method of storing the election and voting data on the blockchain without having to store any metadata related to it. This raises a limitation of application/ project not being user-friendly. So, this system uses a **Double-Write Pattern**. This ensures user-friendliness where user  can log in with their email and can connect their own Blockchain wallet and vote for their candidate. We store the metadata of the candidate and election on the database for future reference.

### Admin Creates Election

1. Smart contract `createElection()` is called via MetaMask.
2. Blockchain returns an `electionId`.
3. Backend stores metadata in MongoDB with that `blockchainId`.

MongoDB → Stores human-readable data  
Blockchain → Stores integrity logic

---

### User Votes

1. User logs in (backend authentication).
2. User connects wallet.
3. User calls `vote(electionId, candidateId)` on-chain.
4. Blockchain enforces:
   - Election must be active
   - Wallet has not voted before

Vote counts are permanently recorded on-chain.

---

## Project Structure

```text
e-voting/
├── backend/      # FastAPI + MongoDB
├── blockchain/   # Hardhat + Solidity contracts
├── frontend/     # React + Tailwind
```
---
## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB (Running locally or via MongoDB Atlas)
- Ganache (Desktop GUI or CLI for local blockchain)
- MetaMask (Browser Extension)
- Git


---


## Environment Variables
Create a `.env` file in your `backend` folder and add your database and security credentials.
The file should look like this:
```bash 
# backend/.env
MONGODB_URL="mongodb://localhost:27017"
JWT_SECRET="your_super_secret_key"
```
---
## Setup Instructions

### Backend
1. Redirect to the backend folder
```bash
cd backend 
```
2. Setup and activate a virtual environment
```bash
python -m venv venv
venv\Scripts\activate
```
3. Install all the required dependencies
```bash
pip install -r requirements.txt
```
4. Run the Application(Backend)
```bash
uvicorn app.main:app --reload
```
### Frontend
1. Open another terminal and redirect to the frontend folder 
```bash
cd frontend
```
2. Install all the packages 
```bash
cd frontend
```
3. Run the frontend
```bash
npm run dev
```
