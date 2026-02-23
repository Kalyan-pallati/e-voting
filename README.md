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

**Responsible for:**
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

**MongoDB** → Stores human-readable data  
**Blockchain** → Stores integrity logic

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

### Blockchain & Ganache (Run this first)
You must have your local blockchain running in the background before deploying contracts or starting the frontend

1. **Start Ganache:**
- Open the Ganache Desktop and click on "Quick Start"
- Leave the application running in the background (Note: Make sure that hardhat.config.js(in the blockchain folder) network section points to the same port on the Ganache GUI. By default, it runs on the port 7545). Ensure that the file looks something like this.
```bash
#blockchain/hardhat.config.js
url: "http://127.0.0.1:7545",
chainId: 1337
```
2. **Open a terminal and navigate to the blockchain folder:**
```bash
cd blockchain
```
3. **Install all the necessary packages**
```bash
npm install
```
4. **Deploy the smart contract to your running Ganache network in the background:**
```bash
npx hardhat ignition deploy ./igniyion/modules/Voting.js --network localhost
```

5. **Copy the file:**
**(Do not skip this step)**
Once deployment is completed, copy the generated Contract address from the terminal and paste it into your frontend configuration file (frontend/src/constants.js). Replace `YOUR_CONTRACT_ADDRESS` with your actual contract address.
```bash
export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"
```
6. **Update ABI :**
Copy the updated VotingSystem.json file from your blockchain artifacts folder(/blockchain/artifacts/contracts/VotingSystem.json) to your frontend artifacts folder(/frontend/src/artifacts) so the frontend(React) knows how to talk to the contract.

### Backend
1. **Navigate to the backend folder**
```bash
cd backend 
```
2. **Setup and activate a virtual environment**
```bash
python -m venv venv
venv\Scripts\activate
```
3. **Install all the required dependencies**
```bash
pip install -r requirements.txt
```
4. **Run the Application(Backend)**
```bash
uvicorn app.main:app --reload
```
5. **Create an Initial Admin Account Manually**    
While the normal user can create his account through the User Interface, the admin account cannot be created through a web interface because of security concerns. So you must create your first Admin account using the API, not by manually editing the database. FastAPI makes this easy with its built-in interactive docs.

- Ensure the FastAPI backend is running.
-  Open your browser and go to: http://127.0.0.1:8000/docs
-  Find the POST /register endpoint and click on it.
-  Click the "Try it out" button.
-  In the Request Body, enter your admin details. Make sure the role is exactly "admin". Example request should be sent like this:
```bash
{
  "email": "admin@college.edu",
  "password": "securepassword123",
  "role": "admin"
}
```
6. **Click Execute. You should see a 201 Successful Response.**
### Frontend
1. **Open another terminal and navigate to the frontend folder**
```bash
cd frontend
```
2. **Install all the packages** 
```bash
cd frontend
```
3. **Run the frontend**
```bash
npm run dev
```
--- 
## Metamask Local Setup (For Testing)
To vote on your local machine, you need to connect MetaMask to your Ganache blockchain.

1. **Open MetaMask** -> Click the network dropdown (top left) -> Add Network -> Add a network manually.

2. **Enter the details:**
- **Network Name:** Ganache Local
- **New RPC URL:** http://127.0.0.1:7545 (or 8545 if using CLI)
- **Chain ID:** 1337
- **Currency Symbol:** ETH

3. Click Save and switch to this network.

4. **Get Test ETH:** Open your Ganache UI, click the "Key" icon next to the first account (Account 0), and copy the Private Key. In **MetaMask**, click your profile circle -> Import Account -> Paste the private key.
5. You can create as many wallets as you want with different private keys.

**IMPORTANT POINT**:   
As this is a local blockchain, you only get access to some of the private keys. Remember that only the Account 0 private key wallet can be used to do any of the admin operations (Creating, editing or deleting elections). While the other private keys can be used for user operations(voting, checking what elections are live). If any other wallet is used with the admin account, it throws an error. So make sure to use the wallet with the Account 0 private address). 

---
## ✨ Key Features

### Admin Dashboard (Election Management)
* **Global Candidate List:** Admins can create a master list of politicians (Name, Party) stored in the database, which can be reused across multiple different elections.
* **Ballot Locking:** Once an election goes "Live," the system locks the ballot, preventing admins from adding, removing, or modifying candidates.
* **Live Result Auditing:** A dedicated results page fetches the immutable vote tally directly from the smart contract, complete with percentages, progress bars, and winner highlights.

### Voter Experience
* **Secure Web2 Authentication:** Voters register and log in using standard Email/Password (secured via hashed passwords and JWT tokens).
* **Web3 Wallet Integration:** Voters connect their MetaMask wallet with a single click to interact with the blockchain.
* **Active Election Feed:** Voters only see elections that are currently active and available for voting.