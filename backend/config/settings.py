import environ
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-this-later')
DEBUG      = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'daphne', 
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'channels',
    'drf_spectacular',
    # Your apps
    'apps.accounts',
    'apps.clients',
    'apps.conversations',
    'apps.messages',
    'apps.integrations',
    
]
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF     = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
AUTH_USER_MODEL  = 'accounts.User'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

SPECTACULAR_SETTINGS = {
    'TITLE':       'Social Media Listening API',
    'DESCRIPTION': 'API for the social media listening and agent management platform',
    'VERSION':     '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}


import dj_database_url

DATABASE_URL = env('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.postgresql',
            'NAME':     env('DB_NAME',     default='social_listening'),
            'USER':     env('DB_USER',     default='postgres'),
            'PASSWORD': env('DB_PASSWORD', default=''),
            'HOST':     env('DB_HOST',     default='localhost'),
            'PORT':     env('DB_PORT',     default='5432'),
        }
    }
MONGODB_URI     = env('MONGODB_URI',     default='mongodb://localhost:27017')
MONGODB_DB_NAME = env('MONGODB_DB_NAME', default='social_listening_db')

REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/0')

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    }
}

CELERY_BROKER_URL     = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  
}

META_VERIFY_TOKEN = env('META_VERIFY_TOKEN', default='')
META_APP_SECRET   = env('META_APP_SECRET',   default='')

STATIC_URL         = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE      = 'en-us'
TIME_ZONE          = 'UTC'
USE_TZ             = True
STATIC_ROOT  = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
CSRF_TRUSTED_ORIGINS = [
    'https://social-media-listening-xgcr.onrender.com',
    'http://localhost:8000',
]
POSTMARK_SERVER_TOKEN = env('POSTMARK_SERVER_TOKEN', default='')
POSTMARK_FROM_EMAIL   = env('POSTMARK_FROM_EMAIL',   default='')