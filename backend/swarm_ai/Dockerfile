FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic
EXPOSE 5700
CMD ["uvicorn", "swarm_ai:app", "--host", "0.0.0.0", "--port", "5700"] 