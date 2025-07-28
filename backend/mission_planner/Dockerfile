FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic
EXPOSE 5200
CMD ["uvicorn", "planner:app", "--host", "0.0.0.0", "--port", "5200"] 