FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic
EXPOSE 5600
CMD ["uvicorn", "video_secure:app", "--host", "0.0.0.0", "--port", "5600"] 