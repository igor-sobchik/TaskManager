# Use an official lightweight Python image
FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker cache
# (Assumes requirements.txt is in the root folder next to Dockerfile)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# --- CHANGED SECTION ---
# Copy ALL files from the local 'backend' folder to the current directory (.)
# This means 'backend/main.py' becomes '/app/main.py' inside the container
COPY backend/ .
# -----------------------

# Create a directory for data (this matches where we mount the volume)
RUN mkdir -p /app/data

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]