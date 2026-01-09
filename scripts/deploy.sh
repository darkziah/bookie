#!/bin/bash

# =============================================================================
# Bookie Deployment Script
# =============================================================================
# This script deploys the client to Firebase Hosting and Convex backend
# to the appropriate environment (preview or production).
#
# Usage:
#   ./scripts/deploy.sh [preview|production] [--skip-client] [--skip-convex]
#
# Prerequisites:
#   - Firebase CLI installed and logged in (firebase login)
#   - Convex CLI installed (comes with convex package)
#   - Environment variables set in .env.preview or .env.production
#
# Environment Variables Required:
#   CONVEX_DEPLOY_KEY       - Deploy key for Convex (from Convex dashboard)
#   CONVEX_URL              - Convex deployment URL
#   CONVEX_AUTH_SECRET      - Convex auth secret
#   JWT_PRIVATE_KEY         - JWT private key for auth
#   JWKS                    - JSON Web Key Set
#   VITE_CONVEX_URL         - Convex URL for client (same as CONVEX_URL)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT=""
SKIP_CLIENT=false
SKIP_CONVEX=false
PREVIEW_RUN_FUNCTION=""

# Print banner
print_banner() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    📚 Bookie Deployment                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print step
print_step() {
    echo -e "\n${BLUE}▸ $1${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Print info
print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Usage information
usage() {
    echo "Usage: $0 [preview|production] [options]"
    echo ""
    echo "Environments:"
    echo "  preview     Deploy to preview/staging environment"
    echo "  production  Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --skip-client   Skip Firebase Hosting deployment"
    echo "  --skip-convex   Skip Convex backend deployment"
    echo "  --preview-run <func> Run the specified function after preview deployment"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 preview                  # Deploy everything to preview"
    echo "  $0 production               # Deploy everything to production"
    echo "  $0 preview --skip-client    # Deploy only Convex to preview"
    echo ""
    exit 1
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            preview|production)
                ENVIRONMENT="$1"
                shift
                ;;
            --skip-client)
                SKIP_CLIENT=true
                shift
                ;;
            --skip-convex)
                SKIP_CONVEX=true
                shift
                ;;
            --preview-run)
                if [ -n "$2" ] && [ ${2:0:1} != "-" ]; then
                    PREVIEW_RUN_FUNCTION="$2"
                    shift 2
                else
                    print_error "Error: --preview-run requires a function name argument."
                    usage
                fi
                ;;
            --help|-h)
                usage
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                ;;
        esac
    done

    if [ -z "$ENVIRONMENT" ]; then
        print_error "Environment not specified"
        usage
    fi
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Install with: bun install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI found: $(firebase --version)"

    # Check if logged into Firebase
    if ! firebase projects:list &> /dev/null 2>&1; then
        print_error "Not logged into Firebase. Run: firebase login"
        exit 1
    fi
    print_success "Firebase authenticated"

    # Check Convex
    if ! bunx convex --version &> /dev/null 2>&1; then
        print_error "Convex CLI not available. Make sure convex is installed."
        exit 1
    fi
    print_success "Convex CLI available"

    # Check Bun
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Install from: https://bun.sh"
        exit 1
    fi
    print_success "Bun found: $(bun --version)"
}

# Load environment variables
load_env() {
    print_step "Loading environment variables for ${ENVIRONMENT}..."
    
    local ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file not found: $ENV_FILE"
        print_info "Creating template environment file..."
        create_env_template "$ENV_FILE"
        print_error "Please fill in the environment variables in $ENV_FILE and run again."
        exit 1
    fi
    
    # Export variables from env file
    set -a
    source "$ENV_FILE"
    set +a
    
    print_success "Environment loaded from $ENV_FILE"
}

# Create environment template
create_env_template() {
    local ENV_FILE="$1"
    cat > "$ENV_FILE" << 'EOF'
# =============================================================================
# Bookie Environment Configuration
# =============================================================================
# Copy this file and fill in the values for your environment.
# 
# To get CONVEX_DEPLOY_KEY:
#   1. Go to your Convex dashboard: https://dashboard.convex.dev
#   2. Select your project (create one if needed)
#   3. Go to Settings > Deploy Keys
#   4. Create a new deploy key
#
# For Firebase:
#   1. Go to Firebase Console: https://console.firebase.google.com
#   2. Create a project or select existing one
#   3. Set up Hosting in the project
# =============================================================================

# Convex Configuration
CONVEX_DEPLOY_KEY=
CONVEX_URL=

# Auth Configuration (generate using: bun run generateKeys.mjs)
CONVEX_AUTH_SECRET=
JWT_PRIVATE_KEY=
JWKS=

# Client Configuration (used during build)
VITE_CONVEX_URL=

# Firebase Configuration
FIREBASE_PROJECT_ID=
EOF
    print_success "Template created at $ENV_FILE"
}

# Validate environment variables
validate_env() {
    print_step "Validating environment variables..."
    
    local missing=()
    
    if [ "$SKIP_CONVEX" = false ]; then
        [ -z "$CONVEX_DEPLOY_KEY" ] && missing+=("CONVEX_DEPLOY_KEY")
    fi
    
    if [ "$SKIP_CLIENT" = false ]; then
        [ -z "$VITE_CONVEX_URL" ] && missing+=("VITE_CONVEX_URL")
        [ -z "$FIREBASE_PROJECT_ID" ] && missing+=("FIREBASE_PROJECT_ID")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Deploy Convex
deploy_convex() {
    if [ "$SKIP_CONVEX" = true ]; then
        print_warning "Skipping Convex deployment"
        return
    fi
    
    print_step "Deploying Convex backend to ${ENVIRONMENT}..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for Convex
    export CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY"
    
    # Deploy based on environment
    if [ "$ENVIRONMENT" = "preview" ]; then
        local CONVEX_ARGS=""
        if [ -n "$PREVIEW_RUN_FUNCTION" ]; then
            CONVEX_ARGS="--preview-run $PREVIEW_RUN_FUNCTION"
            print_info "Will run function: $PREVIEW_RUN_FUNCTION"
        fi

        # For preview, we can use preview deployments if a branch name is available
        if [ -n "$GITHUB_REF_NAME" ] || [ -n "$CI_COMMIT_REF_NAME" ]; then
            BRANCH_NAME="${GITHUB_REF_NAME:-$CI_COMMIT_REF_NAME}"
            print_info "Creating preview deployment for branch: $BRANCH_NAME"
            bunx convex deploy --preview-create "$BRANCH_NAME" $CONVEX_ARGS
        else
            print_info "Deploying to preview project..."
            bunx convex deploy $CONVEX_ARGS
        fi
    else
        print_info "Deploying to production..."
        bunx convex deploy
    fi
    
    print_success "Convex deployed successfully"
}

# Build client
build_client() {
    if [ "$SKIP_CLIENT" = true ]; then
        return
    fi
    
    print_step "Building client application..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for build
    export VITE_CONVEX_URL="$VITE_CONVEX_URL"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        bun install
    fi
    
    # Build the client
    print_info "Building client for ${ENVIRONMENT}..."
    bun run build --filter=@bookie/client
    
    print_success "Client built successfully"
}

# Deploy to Firebase Hosting
deploy_firebase() {
    if [ "$SKIP_CLIENT" = true ]; then
        print_warning "Skipping Firebase deployment"
        return
    fi
    
    print_step "Deploying to Firebase Hosting (${ENVIRONMENT})..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure firebase.json exists
    if [ ! -f "firebase.json" ]; then
        print_info "Creating Firebase configuration..."
        create_firebase_config
    fi
    
    # Ensure .firebaserc exists
    if [ ! -f ".firebaserc" ]; then
        print_info "Creating Firebase project configuration..."
        create_firebaserc
    fi
    
    # Deploy to Firebase
    if [ "$ENVIRONMENT" = "preview" ]; then
        # Deploy to preview channel
        print_info "Deploying to preview channel..."
        firebase hosting:channel:deploy preview \
            --project "$FIREBASE_PROJECT_ID" \
            --expires 7d
    else
        # Deploy to production
        print_info "Deploying to production..."
        firebase deploy \
            --only hosting \
            --project "$FIREBASE_PROJECT_ID"
    fi
    
    print_success "Firebase deployment complete"
}

# Create Firebase configuration
create_firebase_config() {
    cat > "${PROJECT_ROOT}/firebase.json" << 'EOF'
{
  "hosting": {
    "public": "apps/client/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|jpg|jpeg|gif|png|svg|woff|woff2|ttf|eot|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
EOF
    print_success "Created firebase.json"
}

# Create Firebase project configuration
create_firebaserc() {
    cat > "${PROJECT_ROOT}/.firebaserc" << EOF
{
  "projects": {
    "preview": "${FIREBASE_PROJECT_ID}",
    "production": "${FIREBASE_PROJECT_ID}"
  },
  "targets": {},
  "etags": {}
}
EOF
    print_success "Created .firebaserc"
}

# Print deployment summary
print_summary() {
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                   ✓ Deployment Complete!                      ${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Environment:${NC} ${ENVIRONMENT}"
    echo ""
    
    if [ "$SKIP_CONVEX" = false ]; then
        echo -e "${CYAN}Convex:${NC} Deployed"
        [ -n "$CONVEX_URL" ] && echo -e "  URL: ${CONVEX_URL}"
    fi
    
    if [ "$SKIP_CLIENT" = false ]; then
        echo -e "${CYAN}Firebase Hosting:${NC} Deployed"
        echo -e "  Project: ${FIREBASE_PROJECT_ID}"
        if [ "$ENVIRONMENT" = "preview" ]; then
            echo -e "  Channel: preview (expires in 7 days)"
        fi
    fi
    
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
}

# Main function
main() {
    print_banner
    
    parse_args "$@"
    
print_info "Deploying to: $(echo ${ENVIRONMENT} | tr '[:lower:]' '[:upper:]')"
    echo ""
    
    check_prerequisites
    load_env
    validate_env
    
    # Deploy Convex first (backend should be up before frontend)
    deploy_convex
    
    # Build and deploy client
    build_client
    deploy_firebase
    
    print_summary
}

# Run main function with all arguments
main "$@"
