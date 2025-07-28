FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir fastapi uvicorn pyjwt cryptography
EXPOSE 5450
CMD ["uvicorn", "security:app", "--host", "0.0.0.0", "--port", "5450"] 