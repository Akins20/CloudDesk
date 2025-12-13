#!/bin/bash
# CloudDesk VNC Installation Script
# Installs TigerVNC server and desktop environment on Ubuntu

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Desktop environment (default: xfce)
DE=${1:-xfce}

echo -e "${GREEN}CloudDesk VNC Installation Script${NC}"
echo "=================================="
echo "Desktop Environment: $DE"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    if ! command -v sudo &> /dev/null; then
        echo -e "${RED}Error: This script requires root privileges or sudo${NC}"
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

# Check OS
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}Error: Cannot detect OS. This script is designed for Ubuntu.${NC}"
    exit 1
fi

source /etc/os-release

if [[ "$ID" != "ubuntu" && "$ID_LIKE" != *"ubuntu"* ]]; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu. Attempting to continue...${NC}"
fi

echo -e "${GREEN}Detected OS: $PRETTY_NAME${NC}"
echo ""

# Check disk space (require at least 2GB)
AVAILABLE_SPACE=$(df -BG / | tail -1 | awk '{print $4}' | tr -d 'G')
if [ "$AVAILABLE_SPACE" -lt 2 ]; then
    echo -e "${RED}Error: Insufficient disk space. At least 2GB required.${NC}"
    echo "Available: ${AVAILABLE_SPACE}GB"
    exit 1
fi

echo -e "${GREEN}Available disk space: ${AVAILABLE_SPACE}GB${NC}"
echo ""

# Update package lists
echo -e "${YELLOW}Updating package lists...${NC}"
$SUDO apt-get update -qq

# Install X server and dependencies
echo -e "${YELLOW}Installing X server dependencies...${NC}"
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y \
    xorg \
    xauth \
    x11-xserver-utils \
    dbus-x11

# Install VNC server (TigerVNC)
echo -e "${YELLOW}Installing TigerVNC server...${NC}"
if ! $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y tigervnc-standalone-server tigervnc-common; then
    echo -e "${YELLOW}TigerVNC not available, trying tightvncserver...${NC}"
    $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y tightvncserver
fi

# Install desktop environment
echo -e "${YELLOW}Installing $DE desktop environment...${NC}"
case $DE in
    xfce)
        $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y \
            xfce4 \
            xfce4-goodies \
            xfce4-terminal
        STARTCMD="startxfce4"
        ;;
    lxde)
        $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y \
            lxde \
            lxterminal
        STARTCMD="startlxde"
        ;;
    *)
        echo -e "${RED}Error: Unknown desktop environment: $DE${NC}"
        echo "Supported: xfce, lxde"
        exit 1
        ;;
esac

# Create VNC directory for current user
echo -e "${YELLOW}Setting up VNC configuration...${NC}"
mkdir -p ~/.vnc

# Create xstartup script
cat > ~/.vnc/xstartup << EOF
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec $STARTCMD
EOF

chmod +x ~/.vnc/xstartup

# Create VNC config file
cat > ~/.vnc/config << EOF
geometry=1920x1080
depth=24
EOF

# Clean up
echo -e "${YELLOW}Cleaning up...${NC}"
$SUDO apt-get autoremove -y
$SUDO apt-get clean

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VNC Installation completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Desktop Environment: $DE"
echo "VNC Directory: ~/.vnc"
echo ""
echo "To set VNC password, run:"
echo "  vncpasswd"
echo ""
echo "To start VNC server, run:"
echo "  vncserver :1 -geometry 1920x1080 -depth 24"
echo ""
echo "To stop VNC server, run:"
echo "  vncserver -kill :1"
echo ""
