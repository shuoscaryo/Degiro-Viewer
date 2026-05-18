#!/usr/bin/env bash

set -e

show_help() {
    cat << EOF
Usage:
    gen_exports.sh [options] <target_path>

Description:
    Recursively finds all .js files inside the target path
    and generates export statements for them as a barrel file.

Options:
    -o, --output <file>   Output file path
                          Default: <target_path>/index.js

    -a, --append          Append to output file instead of overwrite

    -h, --help            Show this help message

Examples:
    gen_exports.sh ./csvLib

    gen_exports.sh ./csvLib -o ./csvLib/exports.js

    gen_exports.sh ./csvLib --append
EOF
}

append=false
output=""
target=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--output)
            output="$2"
            shift 2
            ;;
        -a|--append)
            append=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            target="$1"
            shift
            ;;
    esac
done

if [[ -z "$target" ]]; then
    echo "Error: target path is required"
    echo
    show_help
    exit 1
fi

# Resolve absolute paths
target_abs="$(cd "$target" && pwd)"

if [[ -z "$output" ]]; then
    output="$target_abs/index.js"
fi

output_abs="$(mkdir -p "$(dirname "$output")" && cd "$(dirname "$output")" && pwd)/$(basename "$output")"

generate_exports() {
    find "$target_abs" -type f -name "*.js" ! -name "$(basename "$output_abs")" | sort | while read -r file; do
        base=$(basename "$file" .js)

        file_abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"

        rel="${file_abs#$target_abs/}"

        echo "export { default as $base } from './$rel';"
    done
}

if $append; then
    generate_exports >> "$output_abs"
else
    generate_exports > "$output_abs"
fi

echo "Exports generated in: $output_abs"