# WebRTC P2P File Transfer

A modern peer-to-peer realtime file transfer platform built using **WebRTC**, **React**, **TypeScript**, and **Socket.io**.

This application enables direct browser-to-browser communication for:

* Realtime chat
* Binary file transfer
* Large file streaming
* Transfer progress tracking
* Drag & drop uploads
* Congestion-controlled chunk transfer

No file data passes through the backend server after peer connection establishment.

---

# Features

## Realtime Peer-to-Peer Communication

* Direct browser-to-browser communication using WebRTC DataChannels
* No backend relay for messages/files after connection

## Modern File Transfer System

* Binary chunk streaming
* Large file support
* Adaptive flow control
* Transfer progress tracking
* Drag & drop upload support
* File reconstruction on receiver side

## Realtime Transport Engineering

* SDP negotiation
* ICE candidate exchange
* NAT traversal
* STUN integration
* Candidate buffering
* Congestion-aware transport

## Modern UI/UX

* Glassmorphism design
* Responsive layout
* Transfer cards
* Toast notifications
* Transfer history
* Realtime speed metrics

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* WebRTC API
* CSS3

## Backend

* Node.js
* Express
* Socket.io

---

# Architecture

## Signaling Layer

Socket.io is used only for:

* Room joining
* SDP offer/answer exchange
* ICE candidate exchange

Once peers connect:

* all communication becomes direct P2P WebRTC transport.

---

# WebRTC Connection Flow

## Step 1 — Join Room

Both peers join the same room using Socket.io.

## Step 2 — SDP Negotiation

Offerer creates:

* SDP offer

Answerer creates:

* SDP answer

These are exchanged through signaling server.

## Step 3 — ICE Candidate Exchange

Peers exchange:

* network candidates
* NAT traversal routes

using STUN server.

## Step 4 — DataChannel Establishment

WebRTC DataChannel becomes:

* connected
* bidirectional
* encrypted

## Step 5 — Direct P2P Transfer

Messages and files travel:
Browser ↔ Browser

without backend relay.

---

# File Transfer Pipeline

File
→ ArrayBuffer
→ Binary Chunks
→ DataChannel
→ Receiver Reconstruction
→ Download

---

# Congestion Control

Large files can overflow WebRTC buffers.

To solve this:

* adaptive backpressure handling was implemented
* sender waits until RTCDataChannel bufferedAmount drains

This prevents:

* queue overflow
* browser crashes
* stalled transfers

---

# Project Structure

client/
├── src/
│   ├── components/
│   ├── socket/
│   ├── webrtc/
│   ├── App.tsx
│   └── App.css

server/
├── src/
│   └── index.ts

---

# Installation

## Clone Repository

```bash
git clone https://github.com/Srbaqua/PeerSync
cd PeerSync
```

---

# Backend Setup

```bash
cd server
npm install
npm run dev
```

Server runs on:

```text
http://localhost:5000
```

---

# Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---



# Future Improvements

* TURN server integration
* Resume interrupted transfers
* Multi-peer rooms
* End-to-end encryption improvements
* Electron desktop app
* Mobile optimization

---

# Learning Outcomes

This project demonstrates understanding of:

* WebRTC
* Distributed systems
* Realtime networking
* Transport protocols
* Congestion control
* Binary streaming
* Peer-to-peer systems
* Modern frontend architecture

---

# Author

Saurabh Chaudhary

B.Tech CSE — NIT Hamirpur
