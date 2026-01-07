// Application Constants

// VNC Configuration
export const VNC_CONSTANTS = {
  DEFAULT_DISPLAY_NUMBER: 1,
  BASE_PORT: 5900, // VNC base port (display :1 = 5901, :2 = 5902, etc.)
  MAX_DISPLAYS: 50, // Maximum concurrent VNC sessions per server
  DEFAULT_GEOMETRY: '1920x1080',
  DEFAULT_DEPTH: 24,
  PASSWORD_LENGTH: 8,
} as const;

// SSH Configuration
export const SSH_CONSTANTS = {
  DEFAULT_PORT: 22,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  KEEPALIVE_INTERVAL: 10000, // 10 seconds
  KEEPALIVE_COUNT_MAX: 3,
  COMMAND_TIMEOUT: 60000, // 60 seconds for command execution
} as const;

// Session Configuration
export const SESSION_CONSTANTS = {
  CLEANUP_INTERVAL_MS: 300000, // 5 minutes
  ACTIVITY_UPDATE_INTERVAL_MS: 60000, // 1 minute
  MAX_SESSIONS_PER_USER: 5,
} as const;

// Authentication Constants
export const AUTH_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  TOKEN_TYPE: 'Bearer',
} as const;

// Rate Limiting (lenient settings for development)
export const RATE_LIMIT_CONSTANTS = {
  AUTH_WINDOW_MS: 60000, // 1 minute
  AUTH_MAX_REQUESTS: 180, // 60 auth attempts per minute
  API_WINDOW_MS: 60000, // 1 minute
  API_MAX_REQUESTS: 900, // 300 requests per minute
} as const;

// Desktop Environments
export const DESKTOP_ENVIRONMENTS = ['xfce', 'lxde'] as const;
export type DesktopEnvironment = typeof DESKTOP_ENVIRONMENTS[number];

// Linux Distribution Families
export const DISTRO_FAMILIES = ['debian', 'rhel', 'arch', 'alpine', 'suse', 'unknown'] as const;
export type DistroFamily = typeof DISTRO_FAMILIES[number];

// Package Managers
export const PACKAGE_MANAGERS = ['apt', 'dnf', 'yum', 'pacman', 'apk', 'zypper', 'unknown'] as const;
export type PackageManager = typeof PACKAGE_MANAGERS[number];

// Dev Software Templates - Pre-configured development tool bundles
export const DEV_SOFTWARE_TEMPLATES = {
  nodejs: {
    name: 'Node.js Development',
    description: 'Node.js, npm, yarn, and common dev tools',
    packages: {
      debian: ['nodejs', 'npm', 'git', 'curl', 'build-essential'],
      rhel: ['nodejs', 'npm', 'git', 'curl', 'gcc', 'gcc-c++', 'make'],
      arch: ['nodejs', 'npm', 'git', 'curl', 'base-devel'],
      alpine: ['nodejs', 'npm', 'git', 'curl', 'build-base'],
      suse: ['nodejs', 'npm', 'git', 'curl', 'gcc', 'gcc-c++', 'make'],
    },
    postInstall: ['sudo npm install -g yarn pnpm'],
  },
  python: {
    name: 'Python Development',
    description: 'Python 3, pip, virtualenv, and dev tools',
    packages: {
      debian: ['python3', 'python3-pip', 'python3-venv', 'git', 'build-essential'],
      rhel: ['python3', 'python3-pip', 'git', 'gcc', 'gcc-c++', 'make'],
      arch: ['python', 'python-pip', 'git', 'base-devel'],
      alpine: ['python3', 'py3-pip', 'git', 'build-base'],
      suse: ['python3', 'python3-pip', 'git', 'gcc', 'gcc-c++', 'make'],
    },
    postInstall: ['sudo pip3 install --break-system-packages virtualenv pipenv'],
  },
  java: {
    name: 'Java Development',
    description: 'OpenJDK, Maven, Gradle',
    packages: {
      debian: ['openjdk-17-jdk', 'maven', 'git', 'curl'],
      rhel: ['java-17-openjdk-devel', 'maven', 'git', 'curl'],
      arch: ['jdk17-openjdk', 'maven', 'git', 'curl'],
      alpine: ['openjdk17', 'maven', 'git', 'curl'],
      suse: ['java-17-openjdk-devel', 'maven', 'git', 'curl'],
    },
    postInstall: [],
  },
  docker: {
    name: 'Docker & Containers',
    description: 'Docker Engine and Docker Compose',
    packages: {
      debian: ['docker.io', 'docker-compose', 'git'],
      rhel: ['docker', 'docker-compose', 'git'],
      arch: ['docker', 'docker-compose', 'git'],
      alpine: ['docker', 'docker-compose', 'git'],
      suse: ['docker', 'docker-compose', 'git'],
    },
    postInstall: ['sudo usermod -aG docker $USER'],
  },
  webdev: {
    name: 'Web Development',
    description: 'Node.js, Git, VS Code CLI, and web tools',
    packages: {
      debian: ['nodejs', 'npm', 'git', 'curl', 'nginx', 'build-essential'],
      rhel: ['nodejs', 'npm', 'git', 'curl', 'nginx', 'gcc', 'make'],
      arch: ['nodejs', 'npm', 'git', 'curl', 'nginx', 'base-devel'],
      alpine: ['nodejs', 'npm', 'git', 'curl', 'nginx', 'build-base'],
      suse: ['nodejs', 'npm', 'git', 'curl', 'nginx', 'gcc', 'make'],
    },
    postInstall: ['sudo npm install -g typescript eslint prettier'],
  },
  devops: {
    name: 'DevOps Tools',
    description: 'Terraform, kubectl, AWS CLI, and infrastructure tools',
    packages: {
      debian: ['git', 'curl', 'wget', 'jq', 'unzip'],
      rhel: ['git', 'curl', 'wget', 'jq', 'unzip'],
      arch: ['git', 'curl', 'wget', 'jq', 'unzip'],
      alpine: ['git', 'curl', 'wget', 'jq', 'unzip'],
      suse: ['git', 'curl', 'wget', 'jq', 'unzip'],
    },
    postInstall: [
      'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl',
    ],
  },
  rust: {
    name: 'Rust Development',
    description: 'Rust toolchain with cargo',
    packages: {
      debian: ['curl', 'build-essential', 'git'],
      rhel: ['curl', 'gcc', 'gcc-c++', 'make', 'git'],
      arch: ['curl', 'base-devel', 'git'],
      alpine: ['curl', 'build-base', 'git'],
      suse: ['curl', 'gcc', 'gcc-c++', 'make', 'git'],
    },
    postInstall: ['curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'],
  },
  go: {
    name: 'Go Development',
    description: 'Go language and tools',
    packages: {
      debian: ['golang', 'git', 'build-essential'],
      rhel: ['golang', 'git', 'gcc', 'make'],
      arch: ['go', 'git', 'base-devel'],
      alpine: ['go', 'git', 'build-base'],
      suse: ['go', 'git', 'gcc', 'make'],
    },
    postInstall: [],
  },
  vscode: {
    name: 'Visual Studio Code',
    description: 'VS Code editor with common extensions',
    packages: {
      debian: ['wget', 'gpg', 'apt-transport-https'],
      rhel: ['wget', 'gpg'],
      arch: ['code'],  // Available in AUR/community
      alpine: ['wget'],
      suse: ['wget', 'gpg'],
    },
    postInstall: [
      // Debian/Ubuntu - Add Microsoft repo and install
      'wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg && sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg && sudo sh -c \'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list\' && rm -f packages.microsoft.gpg && sudo apt update && sudo apt install -y code',
    ],
  },
  chrome: {
    name: 'Google Chrome',
    description: 'Google Chrome browser for web development and testing',
    packages: {
      debian: ['wget', 'gnupg'],
      rhel: ['wget'],
      arch: ['google-chrome'],
      alpine: ['chromium'],
      suse: ['wget'],
    },
    postInstall: [
      'wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O /tmp/chrome.deb && sudo apt install -y /tmp/chrome.deb && rm /tmp/chrome.deb || (wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_arm64.deb -O /tmp/chrome.deb && sudo apt install -y /tmp/chrome.deb && rm /tmp/chrome.deb)',
    ],
  },
  git: {
    name: 'Git & Version Control',
    description: 'Git with useful configuration and tools',
    packages: {
      debian: ['git', 'git-lfs', 'tig', 'gitk'],
      rhel: ['git', 'git-lfs', 'tig'],
      arch: ['git', 'git-lfs', 'tig', 'gitk'],
      alpine: ['git', 'git-lfs', 'tig'],
      suse: ['git', 'git-lfs', 'tig'],
    },
    postInstall: [
      'git lfs install',
    ],
  },
  database: {
    name: 'Database Tools',
    description: 'PostgreSQL, MySQL clients and tools',
    packages: {
      debian: ['postgresql-client', 'mysql-client', 'redis-tools', 'sqlite3'],
      rhel: ['postgresql', 'mysql', 'redis', 'sqlite'],
      arch: ['postgresql-libs', 'mariadb-clients', 'redis', 'sqlite'],
      alpine: ['postgresql-client', 'mysql-client', 'redis', 'sqlite'],
      suse: ['postgresql', 'mariadb-client', 'redis', 'sqlite3'],
    },
    postInstall: [],
  },
  vim: {
    name: 'Vim/Neovim',
    description: 'Vim and Neovim with sensible defaults',
    packages: {
      debian: ['vim', 'neovim', 'tmux', 'fzf', 'ripgrep'],
      rhel: ['vim-enhanced', 'neovim', 'tmux', 'fzf', 'ripgrep'],
      arch: ['vim', 'neovim', 'tmux', 'fzf', 'ripgrep'],
      alpine: ['vim', 'neovim', 'tmux', 'fzf', 'ripgrep'],
      suse: ['vim', 'neovim', 'tmux', 'fzf', 'ripgrep'],
    },
    postInstall: [],
  },
  cpp: {
    name: 'C/C++ Development',
    description: 'GCC, Clang, CMake, and debugging tools',
    packages: {
      debian: ['build-essential', 'clang', 'cmake', 'gdb', 'valgrind', 'git'],
      rhel: ['gcc', 'gcc-c++', 'clang', 'cmake', 'gdb', 'valgrind', 'git'],
      arch: ['base-devel', 'clang', 'cmake', 'gdb', 'valgrind', 'git'],
      alpine: ['build-base', 'clang', 'cmake', 'gdb', 'valgrind', 'git'],
      suse: ['gcc', 'gcc-c++', 'clang', 'cmake', 'gdb', 'valgrind', 'git'],
    },
    postInstall: [],
  },
  dotnet: {
    name: '.NET Development',
    description: '.NET SDK and runtime',
    packages: {
      debian: ['wget', 'apt-transport-https'],
      rhel: ['wget'],
      arch: ['dotnet-sdk'],
      alpine: ['wget'],
      suse: ['wget'],
    },
    postInstall: [
      // Add Microsoft repo for .NET
      'wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh && chmod +x ./dotnet-install.sh && ./dotnet-install.sh --channel 8.0',
    ],
  },
  php: {
    name: 'PHP Development',
    description: 'PHP with Composer and common extensions',
    packages: {
      debian: ['php', 'php-cli', 'php-mbstring', 'php-xml', 'php-curl', 'php-zip', 'composer', 'git'],
      rhel: ['php', 'php-cli', 'php-mbstring', 'php-xml', 'php-curl', 'composer', 'git'],
      arch: ['php', 'composer', 'git'],
      alpine: ['php', 'php-mbstring', 'php-xml', 'php-curl', 'composer', 'git'],
      suse: ['php8', 'php8-composer', 'git'],
    },
    postInstall: [],
  },
  ruby: {
    name: 'Ruby Development',
    description: 'Ruby with rbenv and bundler',
    packages: {
      debian: ['ruby', 'ruby-dev', 'bundler', 'git', 'build-essential'],
      rhel: ['ruby', 'ruby-devel', 'rubygem-bundler', 'git', 'gcc', 'make'],
      arch: ['ruby', 'rubygems', 'git', 'base-devel'],
      alpine: ['ruby', 'ruby-dev', 'ruby-bundler', 'git', 'build-base'],
      suse: ['ruby', 'ruby-devel', 'rubygem-bundler', 'git', 'gcc', 'make'],
    },
    postInstall: [],
  },
  kubernetes: {
    name: 'Kubernetes Tools',
    description: 'kubectl, helm, k9s, and cluster management tools',
    packages: {
      debian: ['curl', 'git', 'wget'],
      rhel: ['curl', 'git', 'wget'],
      arch: ['kubectl', 'helm', 'k9s'],
      alpine: ['curl', 'git', 'wget'],
      suse: ['curl', 'git', 'wget'],
    },
    postInstall: [
      // Install kubectl
      'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && rm kubectl',
      // Install helm
      'curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash',
      // Install k9s
      'curl -sS https://webinstall.dev/k9s | bash',
    ],
  },
  terraform: {
    name: 'Terraform & IaC',
    description: 'Terraform, Ansible, and infrastructure tools',
    packages: {
      debian: ['curl', 'git', 'unzip', 'ansible'],
      rhel: ['curl', 'git', 'unzip', 'ansible'],
      arch: ['terraform', 'ansible', 'git'],
      alpine: ['curl', 'git', 'unzip', 'ansible'],
      suse: ['curl', 'git', 'unzip', 'ansible'],
    },
    postInstall: [
      // Install Terraform
      'curl -fsSL https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip -o terraform.zip && unzip terraform.zip && sudo mv terraform /usr/local/bin/ && rm terraform.zip',
    ],
  },
  aws: {
    name: 'AWS CLI & Tools',
    description: 'AWS CLI v2, SAM CLI, and AWS tools',
    packages: {
      debian: ['curl', 'unzip', 'git'],
      rhel: ['curl', 'unzip', 'git'],
      arch: ['aws-cli-v2', 'git'],
      alpine: ['curl', 'unzip', 'git'],
      suse: ['curl', 'unzip', 'git'],
    },
    postInstall: [
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install && rm -rf awscliv2.zip aws',
    ],
  },
  monitoring: {
    name: 'Monitoring & Debugging',
    description: 'htop, netcat, tcpdump, and system monitoring',
    packages: {
      debian: ['htop', 'iotop', 'iftop', 'netcat-openbsd', 'tcpdump', 'strace', 'lsof', 'net-tools'],
      rhel: ['htop', 'iotop', 'iftop', 'nc', 'tcpdump', 'strace', 'lsof', 'net-tools'],
      arch: ['htop', 'iotop', 'iftop', 'gnu-netcat', 'tcpdump', 'strace', 'lsof', 'net-tools'],
      alpine: ['htop', 'iotop', 'iftop', 'netcat-openbsd', 'tcpdump', 'strace', 'lsof'],
      suse: ['htop', 'iotop', 'iftop', 'netcat', 'tcpdump', 'strace', 'lsof', 'net-tools'],
    },
    postInstall: [],
  },
} as const;

export type DevSoftwareTemplate = keyof typeof DEV_SOFTWARE_TEMPLATES;

// Cloud Providers
export const CLOUD_PROVIDERS = ['ec2', 'oci'] as const;
export type CloudProvider = typeof CLOUD_PROVIDERS[number];

// Instance Authentication Types
export const AUTH_TYPES = ['key', 'password'] as const;
export type AuthType = typeof AUTH_TYPES[number];

// Session Statuses
export const SESSION_STATUSES = ['connecting', 'connected', 'recoverable', 'disconnected', 'error'] as const;
export type SessionStatus = typeof SESSION_STATUSES[number];

// Instance Statuses
export const INSTANCE_STATUSES = ['active', 'inactive'] as const;
export type InstanceStatus = typeof INSTANCE_STATUSES[number];

// User Roles
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// Audit Log Actions
export const AUDIT_ACTIONS = {
  // Auth actions
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // Instance actions
  INSTANCE_CREATE: 'INSTANCE_CREATE',
  INSTANCE_UPDATE: 'INSTANCE_UPDATE',
  INSTANCE_DELETE: 'INSTANCE_DELETE',
  INSTANCE_TEST_CONNECTION: 'INSTANCE_TEST_CONNECTION',

  // Session actions
  SESSION_CONNECT: 'SESSION_CONNECT',
  SESSION_DISCONNECT: 'SESSION_DISCONNECT',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',

  // VNC actions
  VNC_INSTALL: 'VNC_INSTALL',
  VNC_START: 'VNC_START',
  VNC_STOP: 'VNC_STOP',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Error Codes
export const ERROR_CODES = {
  // General
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',

  // Instance
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  INSTANCE_ACCESS_DENIED: 'INSTANCE_ACCESS_DENIED',

  // SSH
  SSH_CONNECTION_FAILED: 'SSH_CONNECTION_FAILED',
  SSH_AUTH_FAILED: 'SSH_AUTH_FAILED',
  SSH_COMMAND_FAILED: 'SSH_COMMAND_FAILED',
  SSH_TIMEOUT: 'SSH_TIMEOUT',

  // VNC
  VNC_NOT_INSTALLED: 'VNC_NOT_INSTALLED',
  VNC_INSTALLATION_FAILED: 'VNC_INSTALLATION_FAILED',
  VNC_START_FAILED: 'VNC_START_FAILED',
  VNC_ALREADY_RUNNING: 'VNC_ALREADY_RUNNING',

  // Session
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_ALREADY_EXISTS: 'SESSION_ALREADY_EXISTS',
  SESSION_LIMIT_REACHED: 'SESSION_LIMIT_REACHED',

  // Password
  INCORRECT_PASSWORD: 'INCORRECT_PASSWORD',

  // Tunnel
  TUNNEL_CREATION_FAILED: 'TUNNEL_CREATION_FAILED',
  NO_PORTS_AVAILABLE: 'NO_PORTS_AVAILABLE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export default {
  VNC_CONSTANTS,
  SSH_CONSTANTS,
  SESSION_CONSTANTS,
  AUTH_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  DESKTOP_ENVIRONMENTS,
  CLOUD_PROVIDERS,
  AUTH_TYPES,
  SESSION_STATUSES,
  INSTANCE_STATUSES,
  USER_ROLES,
  AUDIT_ACTIONS,
  ERROR_CODES,
  HTTP_STATUS,
};
