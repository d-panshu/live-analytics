# 🚀 Global Live Streaming Analytics Platform

A production-grade, event-driven, horizontally scalable real-time analytics system built with **Kafka**, **Redis**, **MongoDB**, **Socket.io**, and **Nginx**.

This system handles high-throughput "Like" events for a live streaming environment, ensuring data consistency and real-time visualization through a decoupled, fault-tolerant pipeline.

---

## 🏗 Architecture Overview



**Client** → **Nginx** (Reverse Proxy + Sticky Sessions) → **API Cluster** (JWT Auth + Kafka Producer) → **Kafka** (Write-Ahead Log) → **Consumer Group** (Batch Processor + Redis Dedup) → **MongoDB** (Aggregated Counters) → **Redis Pub/Sub** → **Socket.io** → **Admin Dashboard**

---

## 🔥 Key Engineering Features

### ⚡ Event-Driven Scalability
* **Decoupled Ingestion**: API services act as thin producers, offloading heavy processing to Kafka to prevent request blocking.
* **Parallel Consumer Groups**: Leverages Kafka partitions to distribute processing load across multiple consumer instances.
* **Sticky Sessions**: Nginx configured with `ip_hash` to maintain stable WebSocket handshakes across a multi-node API cluster.

### 🛡️ Fault Tolerance & Idempotency
* **Redis-Based Deduplication**: Implements the `SET NX EX` pattern to ensure "exactly-once" processing logic during consumer retries.
* **Dead Letter Queue (DLQ)**: Fault isolation pattern where malformed events are routed to a separate Kafka topic for manual inspection without halting the pipeline.
* **Write-Ahead Logging**: Kafka provides a persistent, replayable log of all engagement events.

### 📊 Performance Optimization
* **Batch Aggregation**: Reduces MongoDB IOPS by buffering writes and using `bulkWrite` with atomic `$inc` operators on a 1-second flush interval.
* **Pub/Sub Bridge**: Uses Redis as a messaging backbone to broadcast updates across disparate API nodes to connected WebSocket clients.

---

## 🛠 Tech Stack

* **Runtime**: Node.js (Express)
* **Streaming**: Apache Kafka (Confluent)
* **Database**: MongoDB (Aggregated storage)
* **Caching/Dedup**: Redis
* **Real-time**: Socket.io
* **Orchestration**: Docker & Nginx

---

## 📦 Project Structure
```text
live-analytics/
├── api/                # JWT Auth, Kafka Producer, WebSocket Server
├── consumer/           # Kafka Consumer, Redis Dedup, Batch Processor
├── nginx/              # Load Balancer & Reverse Proxy Configuration
├── docker-compose.yml  # Multi-container Orchestration
└── README.md