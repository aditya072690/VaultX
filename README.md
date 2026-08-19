# 🔒 VaultX — Secure File Storage Service

A full-stack SaaS application for secure file storage, management, and sharing.

## Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Storage:** AWS S3 (or local filesystem)
- **Auth:** JWT + bcrypt

---

## 🛠️ Backend Setup Guide

This guide walks you through setting up a **Cloud PostgreSQL Database** and configuring **AWS S3** for file storage, bypassing the need for local Docker.

### Step 1: Cloud Database Setup (PostgreSQL)

Since Docker is not installed, you can use a free cloud database provider like **Supabase** or **Neon**.

**Using Supabase (Recommended):**
1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Click **New Project**, choose an organization, name it `VaultX`, and set a strong database password. Wait for the database to provision.
3. Once ready, go to **Project Settings** (gear icon) -> **Database**.
4. Scroll down to **Connection String** and select the `URI` tab.
5. Copy the connection string. It will look like this: 
   `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
6. Open your `/backend/.env` file and replace `DATABASE_URL` with this copied URI (don't forget to replace `[YOUR-PASSWORD]` with the password you set in step 2).

### Step 2: AWS S3 Setup (Cloud Storage)

VaultX supports both local storage and AWS S3. For production or true cloud storage, configure AWS S3.

1. Go to the [AWS Console](https://aws.amazon.com/console/) and sign in.
2. Navigate to **S3** and click **Create bucket**.
   - Name your bucket (e.g., `vaultx-storage-dev`).
   - Leave public access blocked (VaultX handles secure access).
   - Create the bucket.
3. Navigate to **IAM** (Identity and Access Management).
   - Go to **Users** -> **Add users**. Name it `vaultx-api-user`.
   - On permissions, select **Attach policies directly** and attach `AmazonS3FullAccess`.
   - Complete creation, then go to the user's **Security credentials** tab.
   - Click **Create access key**, choose "Application running outside AWS", and copy the **Access Key ID** and **Secret Access Key**.
4. Open your `/backend/.env` file and update the variables:
   ```env
   STORAGE_MODE=s3
   AWS_REGION=your-region-name (e.g., us-east-1)
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_BUCKET=vaultx-storage-dev
   ```

### Step 3: Run the Backend

Once your `.env` is configured with the Cloud Database and AWS S3:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Push the Prisma schema to your cloud database
npx prisma db push

# Start the development server
npm run dev
# → API running at http://localhost:5000
```

---

### Step 4: Run the Frontend

In a separate terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the web app
npm run dev
# → Web app running at http://localhost:3000
```

## Project Structure
```
VaultX/
├── backend/     # Express API server (Run this on port 5000)
├── frontend/    # Next.js web app (Run this on port 3000)
└── docs/        # Implementation guides
```
