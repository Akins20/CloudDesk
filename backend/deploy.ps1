# CloudDesk Backend Deployment Script (PowerShell)
# Deploys the backend to EC2 instance with Docker

param(
    [switch]$SkipBuild,
    [switch]$LogsOnly
)

$ErrorActionPreference = "Stop"

# Configuration
$EC2_HOST = "3.219.12.124"
$EC2_USER = "ubuntu"
$EC2_KEY = "CloudDesk.pem"
$REMOTE_DIR = "/home/ubuntu/clouddesk"
$BACKEND_DIR = $PSScriptRoot

# Helper functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Check if PEM file exists
$PEM_PATH = Join-Path $BACKEND_DIR $EC2_KEY
if (-not (Test-Path $PEM_PATH)) {
    Write-Err "PEM file not found: $PEM_PATH"
    exit 1
}

# SSH command helper
function Invoke-SSH {
    param([string]$Command)
    ssh -i $PEM_PATH -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" $Command
}

# SCP command helper
function Invoke-SCP {
    param([string]$Source, [string]$Dest)
    scp -i $PEM_PATH -o StrictHostKeyChecking=no $Source $Dest
}

# If logs only mode
if ($LogsOnly) {
    Write-Info "Fetching logs from EC2..."
    Invoke-SSH "cd $REMOTE_DIR && docker compose logs --tail=100"
    exit 0
}

Write-Info "Starting CloudDesk Backend Deployment to EC2..."
Write-Info "Host: $EC2_HOST"
Write-Info "User: $EC2_USER"

# Step 1: Install Docker on EC2 if not present
Write-Info "Step 1: Checking/Installing Docker on EC2..."

$dockerInstallScript = @'
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi
docker compose version || sudo apt-get install -y docker-compose-plugin
'@

Invoke-SSH $dockerInstallScript

# Step 2: Create remote directory
Write-Info "Step 2: Creating remote directory..."
Invoke-SSH "mkdir -p $REMOTE_DIR/docker"

# Step 3: Copy files to EC2
Write-Info "Step 3: Copying files to EC2..."

# Create temp directory
$TEMP_DIR = Join-Path $env:TEMP "clouddesk-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

try {
    # Copy necessary files
    Copy-Item (Join-Path $BACKEND_DIR "package.json") $TEMP_DIR
    if (Test-Path (Join-Path $BACKEND_DIR "package-lock.json")) {
        Copy-Item (Join-Path $BACKEND_DIR "package-lock.json") $TEMP_DIR
    }
    Copy-Item (Join-Path $BACKEND_DIR "tsconfig.json") $TEMP_DIR
    Copy-Item (Join-Path $BACKEND_DIR "Dockerfile") $TEMP_DIR
    Copy-Item (Join-Path $BACKEND_DIR ".dockerignore") $TEMP_DIR
    Copy-Item (Join-Path $BACKEND_DIR "docker-compose.yml") $TEMP_DIR
    Copy-Item -Recurse (Join-Path $BACKEND_DIR "src") $TEMP_DIR
    Copy-Item -Recurse (Join-Path $BACKEND_DIR "scripts") $TEMP_DIR
    Copy-Item -Recurse (Join-Path $BACKEND_DIR "docker") $TEMP_DIR

    # Handle .env file
    if (Test-Path (Join-Path $BACKEND_DIR ".env.production")) {
        Copy-Item (Join-Path $BACKEND_DIR ".env.production") (Join-Path $TEMP_DIR ".env")
        Write-Warn "Using .env.production as .env - make sure to update secrets!"
    } elseif (Test-Path (Join-Path $BACKEND_DIR ".env")) {
        Copy-Item (Join-Path $BACKEND_DIR ".env") $TEMP_DIR
    }

    # Create tarball using tar (if available via Git Bash or WSL)
    $TAR_FILE = Join-Path $TEMP_DIR "clouddesk-backend.tar.gz"

    Push-Location $TEMP_DIR
    try {
        # Try using tar from Git Bash or system
        & tar -czf "clouddesk-backend.tar.gz" --exclude="clouddesk-backend.tar.gz" .
    } catch {
        Write-Err "tar command failed. Make sure Git Bash is installed or tar is available."
        exit 1
    }
    Pop-Location

    # Upload to EC2
    Invoke-SCP $TAR_FILE "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/"

    # Extract on EC2
    Invoke-SSH "cd $REMOTE_DIR && tar -xzf clouddesk-backend.tar.gz && rm clouddesk-backend.tar.gz"
}
finally {
    # Cleanup
    Remove-Item -Recurse -Force $TEMP_DIR -ErrorAction SilentlyContinue
}

# Step 4: Generate secrets
Write-Info "Step 4: Checking environment configuration..."

$secretsScript = @'
cd /home/ubuntu/clouddesk

if [ -f .env ]; then
    if grep -q "your_secure\|your_64_character\|your_jwt" .env; then
        echo "Generating secure secrets..."
        JWT_ACCESS=$(openssl rand -base64 48 | tr -d '\n')
        JWT_REFRESH=$(openssl rand -base64 48 | tr -d '\n')
        ENCRYPTION=$(openssl rand -hex 32)
        MONGO_ROOT_PASS=$(openssl rand -base64 24 | tr -d '\n')
        MONGO_APP_PASS=$(openssl rand -base64 24 | tr -d '\n')

        sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS|g" .env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH|g" .env
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION|g" .env
        sed -i "s|MONGO_ROOT_PASSWORD=.*|MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASS|g" .env
        sed -i "s|MONGO_PASSWORD=.*|MONGO_PASSWORD=$MONGO_APP_PASS|g" .env
        echo "Secrets generated"
    else
        echo "Secrets already configured"
    fi
else
    echo "ERROR: .env file not found!"
    exit 1
fi
'@

Invoke-SSH $secretsScript

# Step 5: Build and start containers
Write-Info "Step 5: Building and starting Docker containers..."

$buildScript = @'
cd /home/ubuntu/clouddesk
docker compose down 2>/dev/null || true
docker compose up -d --build
echo "Waiting for services to start..."
sleep 10
docker compose ps
'@

Invoke-SSH $buildScript

# Step 6: Verify deployment
Write-Info "Step 6: Verifying deployment..."

$verifyScript = @'
cd /home/ubuntu/clouddesk
echo "Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo "Backend is healthy!"
        exit 0
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done
echo "Health check failed. Logs:"
docker compose logs --tail=50 backend
exit 1
'@

Invoke-SSH $verifyScript

Write-Host ""
Write-Info "============================================"
Write-Info "Deployment Complete!"
Write-Info "============================================"
Write-Info "Backend API: http://${EC2_HOST}:3000"
Write-Info "Health Check: http://${EC2_HOST}:3000/api/health"
Write-Host ""
Write-Warn "IMPORTANT: Update your frontend to use the new backend URL"
Write-Warn "Make sure port 3000 is open in EC2 Security Group"
Write-Host ""
