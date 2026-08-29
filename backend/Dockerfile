FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    INSTALL_HYDROLOGY=0

RUN apt-get update \
    && apt-get install -y --no-install-recommends binutils gdal-bin libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt requirements-hydrology.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && if [ "$INSTALL_HYDROLOGY" = "1" ]; then pip install --no-cache-dir -r requirements-hydrology.txt; fi

COPY . .

EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_demo && exec gunicorn aegis_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 60"]
