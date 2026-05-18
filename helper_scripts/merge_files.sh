#!/usr/bin/env bash

set -euo pipefail

print_help() {
  cat << 'EOF'
Usage:
  collect_files.sh -e <ext> [-e <ext> ...] [files or directories...]

Description:
  Collects content from files matching given extensions and prints it to stdout.

Options:
  -e    File extension (can be repeated), e.g. -e .c -e .h
  -h    Show help

Examples:
  ./collect_files.sh -e .c -e .h src/ include/ > output.txt
  ./collect_files.sh -e .py scripts/ > all_python.txt
EOF
}

error_and_help() {
  echo "Error: $1" >&2
  echo "" >&2
  print_help >&2
  exit 1
}

extensions=()

while getopts ":e:h" opt; do
  case "$opt" in
    e)
      ext="${OPTARG}"
      # normalize: remove leading dot if present
      ext="${ext#.}"
      extensions+=("$ext")
      ;;
    h)
      print_help
      exit 0
      ;;
    \?)
      error_and_help "Invalid option: -$OPTARG"
      ;;
    :)
      error_and_help "Option -$OPTARG requires an argument"
      ;;
  esac
done

shift $((OPTIND - 1))

if [[ "${#extensions[@]}" -eq 0 ]]; then
  error_and_help "You must provide at least one -e extension"
fi

if [[ "$#" -eq 0 ]]; then
  error_and_help "You must provide at least one file or directory"
fi

# Build find expression
find_expr=()
for ext in "${extensions[@]}"; do
  find_expr+=( -name "*.${ext}" -o )
done
unset 'find_expr[${#find_expr[@]}-1]' 2>/dev/null || true

process_file() {
  local file="$1"

  if [[ -f "$file" ]]; then
    echo "===== FILE: $file ====="
    cat "$file"
    echo
  fi
}

for path in "$@"; do
  if [[ -f "$path" ]]; then
    process_file "$path"

  elif [[ -d "$path" ]]; then
    while IFS= read -r file; do
      process_file "$file"
    done < <(find "$path" -type f \( "${find_expr[@]}" \))

  else
    echo "Warning: '$path' not found, skipping" >&2
  fi
done