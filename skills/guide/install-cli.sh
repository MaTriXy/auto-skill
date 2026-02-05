#!/usr/bin/env bash
# Auto-Skill CLI Installation Script
# Run after: npx skills add MaTriXy/auto-skill

set -e

echo "Auto-Skill CLI Installation"
echo ""

# Check if we're in a CI environment
if [ -n "$CI" ]; then
    echo "CI environment detected. Skipping CLI installation."
    exit 0
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. CLI installation skipped."
    echo "   Install Node.js 18+ to use auto-skill CLI commands."
    echo "   https://nodejs.org/"
    exit 0
fi

NODE_VERSION=$(node -v)
echo "Node.js $NODE_VERSION found"
echo ""

echo "The auto-skill CLI tool provides commands like:"
echo "  auto-skill init       # Initialize auto-skill for a project"
echo "  auto-skill discover   # Discover skill patterns"
echo "  auto-skill search     # Search external skills"
echo "  auto-skill stats      # Show adoption statistics"
echo "  auto-skill agents     # Manage agent configurations"
echo "  auto-skill graduate   # Manage skill graduation"
echo ""

# Non-interactive check
AUTO_INSTALL=${AUTO_SKILL_AUTO_INSTALL:-false}

if [ "$AUTO_INSTALL" = "true" ]; then
    INSTALL="y"
else
    read -p "Would you like to install the CLI tool now? (y/N) " -n 1 -r INSTALL
    echo ""
fi

if [[ $INSTALL =~ ^[Yy]$ ]]; then
    echo ""
    echo "Installing auto-skill CLI..."

    # Check for npm
    if ! command -v npm &> /dev/null; then
        echo "npm not found. Please install npm and try again."
        exit 1
    fi

    npm install -g @matrixy/auto-skill
    echo ""
    echo "Installed! Run: auto-skill init"
else
    echo ""
    echo "Skipped CLI installation."
    echo ""
    echo "To install later, run:"
    echo "  npm install -g @matrixy/auto-skill"
    echo ""
    echo "Or use without installing:"
    echo "  npx auto-skill init"
    echo ""
    echo "Or set AUTO_SKILL_AUTO_INSTALL=true to auto-install next time."
fi

echo ""
echo "Agent skills installed successfully!"
echo "   Skills available in: .agents/skills/"
