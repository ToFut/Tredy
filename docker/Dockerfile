# Setup base image
FROM ubuntu:jammy-20240627.1 AS base

# Build arguments
ARG ARG_UID=1000
ARG ARG_GID=1000

FROM base AS build-arm64
RUN echo "Preparing build of AnythingLLM image for arm64 architecture"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install system dependencies
# hadolint ignore=DL3008,DL3013
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
        unzip curl gnupg libgfortran5 libgbm1 tzdata netcat \
        libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
        libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
        libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
        libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
        xdg-utils git build-essential ffmpeg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    # Install node and yarn
    apt-get install -yq --no-install-recommends nodejs && \
    curl -LO https://github.com/yarnpkg/yarn/releases/download/v1.22.19/yarn_1.22.19_all.deb \
        && dpkg -i yarn_1.22.19_all.deb \
        && rm yarn_1.22.19_all.deb && \
    # Install uvx (pinned to 0.6.10) for MCP support
    curl -LsSf https://astral.sh/uv/0.6.10/install.sh | sh && \
        mv /root/.local/bin/uv /usr/local/bin/uv && \
        mv /root/.local/bin/uvx /usr/local/bin/uvx && \
        echo "Installed uvx! $(uv --version)" && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a group and user with specific UID and GID
RUN groupadd -g "$ARG_GID" anythingllm && \
    useradd -l -u "$ARG_UID" -m -d /app -s /bin/bash -g anythingllm anythingllm && \
    mkdir -p /app/frontend/ /app/server/ /app/collector/ && chown -R anythingllm:anythingllm /app

# Copy docker helper scripts
COPY ./docker/docker-entrypoint.sh /usr/local/bin/
COPY ./docker/docker-healthcheck.sh /usr/local/bin/
COPY --chown=anythingllm:anythingllm ./docker/.env.example /app/server/.env

# Ensure the scripts are executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-healthcheck.sh

USER anythingllm
WORKDIR /app

# Puppeteer does not ship with an ARM86 compatible build for Chromium
# so web-scraping would be broken in arm docker containers unless we patch it
# by manually installing a compatible chromedriver.
RUN echo "Need to patch Puppeteer x Chromium support for ARM86 - installing dep!" && \
    curl https://playwright.azureedge.net/builds/chromium/1088/chromium-linux-arm64.zip -o chrome-linux.zip && \
    unzip chrome-linux.zip && \
    rm -rf chrome-linux.zip

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/app/chrome-linux/chrome
ENV PUPPETEER_EXECUTABLE_PATH=/app/chrome-linux/chrome

RUN echo "Done running arm64 specific installation steps"

#############################################

# amd64-specific stage
FROM base AS build-amd64
RUN echo "Preparing build of AnythingLLM image for non-ARM architecture"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install system dependencies
# hadolint ignore=DL3008,DL3013
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
        curl gnupg libgfortran5 libgbm1 tzdata netcat \
        libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
        libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 \
        libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
        libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release \
        xdg-utils git build-essential ffmpeg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    # Install node and yarn
    apt-get install -yq --no-install-recommends nodejs && \
    curl -LO https://github.com/yarnpkg/yarn/releases/download/v1.22.19/yarn_1.22.19_all.deb \
        && dpkg -i yarn_1.22.19_all.deb \
        && rm yarn_1.22.19_all.deb && \
    # Install uvx (pinned to 0.6.10) for MCP support
    curl -LsSf https://astral.sh/uv/0.6.10/install.sh | sh && \
        mv /root/.local/bin/uv /usr/local/bin/uv && \
        mv /root/.local/bin/uvx /usr/local/bin/uvx && \
        echo "Installed uvx! $(uv --version)" && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a group and user with specific UID and GID
RUN groupadd -g "$ARG_GID" anythingllm && \
    useradd -l -u "$ARG_UID" -m -d /app -s /bin/bash -g anythingllm anythingllm && \
    mkdir -p /app/frontend/ /app/server/ /app/collector/ && chown -R anythingllm:anythingllm /app

# Copy docker helper scripts
COPY ./docker/docker-entrypoint.sh /usr/local/bin/
COPY ./docker/docker-healthcheck.sh /usr/local/bin/
COPY --chown=anythingllm:anythingllm ./docker/.env.example /app/server/.env

# Ensure the scripts are executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-healthcheck.sh

#############################################
# COMMON BUILD FLOW FOR ALL ARCHS
#############################################

# hadolint ignore=DL3006
FROM build-${TARGETARCH} AS build
RUN echo "Running common build flow of AnythingLLM image for all architectures"

USER anythingllm
WORKDIR /app

# Install & Build frontend layer
FROM build AS frontend-build
COPY --chown=anythingllm:anythingllm ./frontend /app/frontend/
WORKDIR /app/frontend
RUN yarn install --network-timeout 100000 && yarn cache clean
RUN yarn build && \
    cp -r dist /tmp/frontend-build && \
    rm -rf * && \
    cp -r /tmp/frontend-build dist && \
    rm -rf /tmp/frontend-build
WORKDIR /app

# Install server layer
# Also pull and build collector deps (chromium issues prevent bad bindings)
FROM build AS backend-build
COPY --chown=anythingllm:anythingllm ./server /app/server/
WORKDIR /app/server
RUN yarn install --production --network-timeout 100000 && yarn cache clean
WORKDIR /app

# Install collector dependencies
COPY --chown=anythingllm:anythingllm ./collector/ ./collector/
WORKDIR /app/collector
ENV PUPPETEER_DOWNLOAD_BASE_URL=https://storage.googleapis.com/chrome-for-testing-public
RUN yarn install --production --network-timeout 100000 && yarn cache clean

WORKDIR /app
USER anythingllm

# Since we are building from backend-build we just need to move built frontend into server/public
FROM backend-build AS production-build
WORKDIR /app
COPY --chown=anythingllm:anythingllm --from=frontend-build /app/frontend/dist /app/server/public
USER root
RUN mkdir -p /app/server/storage && \
    chown -R anythingllm:anythingllm /app/server && \
    chown -R anythingllm:anythingllm /app/collector && \
    chmod -R 755 /app/server/storage
USER anythingllm

# Setup the environment
ENV NODE_ENV=production
ENV ANYTHING_LLM_RUNTIME=docker
ENV DEPLOYMENT_VERSION=1.8.5

# Core Configuration
ENV STORAGE_DIR=/app/server/storage
ENV PORT=3001
ENV SERVER_PORT=3001
ENV UID=1000
ENV GID=1000

# Authentication & Security
ENV AUTH_TOKEN=""
ENV JWT_SECRET="anything-llm-jwt-secret-changeme-in-production"
ENV JWT_EXPIRY="30d"
ENV SIG_KEY="anythingllm-signing-key-changeme-in-production"
ENV SIG_SALT="anythingllm-signing-salt-changeme-in-production"
ENV DISABLE_TELEMETRY=true

# Database Configuration
ENV DATABASE_CONNECTION_STRING=""
ENV VECTOR_DB=lancedb
ENV PINECONE_API_KEY=""
ENV PINECONE_INDEX=""
ENV CHROMA_ENDPOINT=""
ENV CHROMA_API_HEADER=""
ENV CHROMA_API_KEY=""
ENV WEAVIATE_ENDPOINT=""
ENV WEAVIATE_API_KEY=""
ENV QDRANT_ENDPOINT=""
ENV QDRANT_API_KEY=""
ENV MILVUS_ADDRESS=""
ENV MILVUS_USERNAME=""
ENV MILVUS_PASSWORD=""
ENV ZILLIZ_ENDPOINT=""
ENV ZILLIZ_API_TOKEN=""
ENV ASTRA_DB_APPLICATION_TOKEN=""
ENV ASTRA_DB_ENDPOINT=""

# LLM Provider Configuration
ENV LLM_PROVIDER=togetherai
ENV TOGETHER_AI_API_KEY=""
ENV TOGETHER_AI_MODEL_PREF="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
ENV OPEN_AI_KEY=""
ENV OPEN_MODEL_PREF="gpt-4o"
ENV AZURE_OPENAI_ENDPOINT=""
ENV AZURE_OPENAI_KEY=""
ENV ANTHROPIC_API_KEY=""
ENV ANTHROPIC_MODEL_PREF="claude-3-sonnet-20240229"
ENV GEMINI_API_KEY=""
ENV GEMINI_LLM_MODEL_PREF="gemini-2.0-flash-lite"
ENV OLLAMA_BASE_PATH=""
ENV OLLAMA_MODEL_PREF=""
ENV GROQ_API_KEY=""
ENV GROQ_MODEL_PREF="llama-3.1-70b-versatile"
ENV HUGGING_FACE_LLM_ENDPOINT=""
ENV HUGGING_FACE_LLM_API_KEY=""
ENV GENERIC_OPEN_AI_BASE_PATH=""
ENV GENERIC_OPEN_AI_API_KEY=""
ENV GENERIC_OPEN_AI_MODEL_PREF=""
ENV COHERE_API_KEY=""
ENV COHERE_MODEL_PREF="command-r-plus"
ENV PERPLEXITY_API_KEY=""
ENV PERPLEXITY_MODEL_PREF="llama-3.1-sonar-large-128k-online"

# Embedding Configuration
ENV EMBEDDING_ENGINE=native
ENV EMBEDDING_MODEL_PREF="Xenova/all-MiniLM-L6-v2"
ENV EMBEDDING_BASE_PATH=""
ENV EMBEDDING_MODEL_MAX_CHUNK_LENGTH=8192
ENV OPEN_AI_KEY_EMBEDDING=""
ENV AZURE_OPENAI_EMBEDDING_ENDPOINT=""
ENV AZURE_OPENAI_EMBEDDING_KEY=""
ENV AZURE_OPENAI_EMBEDDING_MODEL_PREF=""
ENV COHERE_API_KEY_EMBEDDING=""
ENV VOYAGE_AI_API_KEY=""
ENV OLLAMA_BASE_PATH_EMBEDDING=""

# Transcription Configuration
ENV WHISPER_PROVIDER=local
ENV OPENAI_WHISPER_API_KEY=""
ENV ASSEMBLYAI_API_KEY=""
ENV DEEPGRAM_API_KEY=""

# TTS Configuration
ENV TTS_PROVIDER=""
ENV TTS_VOICE_PREF=""
ENV TTS_OPEN_AI_KEY=""
ENV TTS_OPEN_AI_VOICE_MODEL="alloy"
ENV TTS_ELEVEN_LABS_KEY=""
ENV TTS_ELEVEN_LABS_VOICE=""
ENV GENERIC_TTS_BASE_PATH=""
ENV GENERIC_TTS_VOICE=""

# STT Configuration
ENV STT_PROVIDER=""
ENV STT_OPEN_AI_KEY=""
ENV STT_ENGINE=""

# Agent Configuration
ENV AGENT_LLM_PROVIDER=""
ENV AGENT_LLM_MODEL=""
ENV AGENT_SEARCH_PROVIDER="none"
ENV AGENT_SERPER_DEV_KEY=""
ENV AGENT_BING_SEARCH_API_KEY=""
ENV AGENT_SERPLY_API_KEY=""
ENV AGENT_SEARXNG_API_URL=""
ENV AGENT_GOOGLE_SEARCH_API_KEY=""
ENV AGENT_GOOGLE_SEARCH_ENGINE_ID=""
ENV AGENT_TAVILY_API_KEY=""
ENV AGENT_USE_OPENAI_FUNCTIONS=false
ENV AGENT_SQL_CONNECTIONS=""
ENV DEFAULT_AGENT_SKILLS=""
ENV DISABLED_AGENT_SKILLS=""
ENV AGENT_GSE_CTX=""
ENV AGENT_GSE_KEY=""

# Browser Extension Configuration
ENV BROWSER_EXTENSION_API_KEY=""

# Community Hub Configuration
ENV HUB_API_KEY=""

# Supabase Configuration (Optional)
ENV SUPABASE_URL=""
ENV SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

# Email Configuration (Optional)
ENV GMAIL_CLIENT_ID=""
ENV GMAIL_CLIENT_SECRET=""
ENV EMAIL_TEMPLATES_PATH="/app/server/storage/email-templates"

# Logging Configuration
ENV LOG_LEVEL="info"
ENV LOG_FORMAT="json"

# Rate Limiting
ENV RATE_LIMIT_ENABLED=true
ENV RATE_LIMIT_WINDOW_MS=60000
ENV RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
ENV FILE_UPLOAD_LIMIT="3GB"
ENV MAX_CONCURRENT_UPLOADS=5
ENV MAX_DOCUMENT_COUNT_PER_WORKSPACE=500

# Performance Tuning
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV WORKERS_COUNT=2

# Custom Branding
ENV CUSTOM_APP_NAME="Tredy"
ENV META_PAGE_TITLE="Tredy - AI Assistant"
ENV META_PAGE_FAVICON="/favicon.png"
ENV LOGO_FILENAME="tredy-logo.png"
ENV SUPPORT_EMAIL="support@tredy.ai"
ENV FOOTER_DATA=""

# Text Processing Configuration
ENV TEXT_SPLITTER_CHUNK_SIZE=1000
ENV TEXT_SPLITTER_CHUNK_OVERLAP=100
ENV MAX_EMBED_CHUNK_SIZE=1000

# Feature Flags
ENV FEATURE_FLAGS=""
ENV EXPERIMENTAL_FEATURES=false

# Mobile App Configuration
ENV MOBILE_APP_ENABLED=false

# MCP (Model Context Protocol) Configuration
ENV MCP_ENABLED=false
ENV MCP_SERVERS=""

# Together AI Specific Configuration (Default Provider)
ENV TOGETHER_AI_API_KEY="e9e5022a483835887a9a3bc18a7647aaaea5af2936efe5898b6cd0f7a350c282"
ENV TOGETHER_AI_MODEL_PREF="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
ENV TOGETHER_AI_COMPLETION_MODEL_PREF="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
ENV TOGETHER_AI_EMBEDDING_MODEL_PREF=""

# Expose the port
EXPOSE 3001

# Create necessary directories and set permissions
RUN mkdir -p /app/server/storage/documents \
    /app/server/storage/vector-cache \
    /app/server/storage/lancedb \
    /app/server/storage/outputs \
    /app/server/storage/logs \
    /app/server/storage/tmp \
    /app/server/storage/email-templates \
    /app/server/storage/models \
    /app/server/storage/imports \
    /app/server/storage/exports \
    /app/server/storage/comkey \
    /app/server/storage/workspace-chats \
    /app/server/storage/workspace-settings \
    /app/server/storage/workspace-documents && \
    chown -R anythingllm:anythingllm /app/server/storage && \
    chmod -R 755 /app/server/storage

# Note: Railway manages volumes through their dashboard
# Mount a Railway volume to /app/server/storage for persistent data

# Set working directory
WORKDIR /app

# Labels for container metadata
LABEL maintainer="Tredy AI <support@tredy.ai>"
LABEL version="1.8.5"
LABEL description="Tredy AI - Enterprise AI Assistant Platform"
LABEL org.opencontainers.image.source="https://github.com/ToFut/Tredy"
LABEL org.opencontainers.image.documentation="https://docs.tredy.ai"
LABEL org.opencontainers.image.licenses="MIT"

# Healthcheck configuration (can be enabled if needed)
# For local/standard Docker deployments
# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
#   CMD curl -f http://localhost:3001/api/ping || exit 1

# For Railway deployment (disabled as Railway has its own monitoring)
# Railway uses its own health monitoring system

# Security: Run as non-root user
USER anythingllm

# Entry point script handles database migrations and service startup
ENTRYPOINT ["/bin/bash", "/usr/local/bin/docker-entrypoint.sh"]

# Default command (can be overridden)
CMD []
