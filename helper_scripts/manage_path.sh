#!/usr/bin/env bash

set -e

START_MARK="# >>> helper_functions PATH >>>"
END_MARK="# <<< helper_functions PATH <<<"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_FILE="${HOME}/.bashrc"

REMOVE=false
SILENT=false

show_help() {
    cat << EOF
Usage:
    manage_path.sh [options]

Description:
    Installs or removes this directory from PATH.

Default behavior:
    - Adds directory to PATH
    - Makes .sh files executable
    - Attempts to refresh shell environment
    - Continues on errors (non-blocking)

Options:
    -r, --remove     Remove PATH entry
    -s, --silent     Minimal output
    -p, --profile    Target profile (default: ~/.bashrc)
    -h, --help       Show help

Examples:
    manage_path.sh
    manage_path.sh --remove
    manage_path.sh --profile ~/.zshrc

EOF
}

log() {
    $SILENT || echo "$1"
}

fail() {
    echo "Warning: $1"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -r|--remove)
            REMOVE=true
            shift
            ;;
        -s|--silent)
            SILENT=true
            shift
            ;;
        -p|--profile)
            PROFILE_FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

remove_block() {
    if grep -q "$START_MARK" "$PROFILE_FILE" 2>/dev/null; then
        sed -i "/$START_MARK/,/$END_MARK/d" "$PROFILE_FILE" 2>/dev/null || fail "Could not remove PATH block"
        log "Removed PATH entry"
    else
        log "No PATH entry found"
    fi
}

add_block() {
    remove_block || true

    {
        echo ""
        echo "$START_MARK"
        echo "export PATH=\"$SCRIPT_DIR:\$PATH\""
        echo "$END_MARK"
    } >> "$PROFILE_FILE" || fail "Could not write to profile"

    log "Added to PATH: $SCRIPT_DIR"
}

chmod_files() {
    chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || fail "chmod failed (maybe no .sh files)"
    log "Updated script permissions"
}

refresh_shell() {
    if [[ -n "$BASH_VERSION" ]]; then
        log "Refreshing shell..."
        exec "$SHELL"
    else
        log "Restart terminal to apply changes"
    fi
}

if $REMOVE; then
    remove_block
else
    add_block
    chmod_files
    refresh_shell
fi