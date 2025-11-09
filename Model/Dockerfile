FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy code
COPY . .

RUN pip install uv

# Install dependencies
RUN uv sync

# Expose the port FastAPI runs on
EXPOSE 7860

# Run FastAPI app
# CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "7860"]
CMD ["uv", "run", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "7860"]
