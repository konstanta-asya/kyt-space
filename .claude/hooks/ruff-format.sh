#!/usr/bin/env bash
# PostToolUse-хук: після Edit/Write форматує змінений .py-файл через ruff
# і сортує імпорти. Інші автофікси (напр. видалення «невикористаних» імпортів)
# свідомо не вмикаємо — агент міг ще не дописати код, що їх використовує.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[[ "$file" == *.py ]] || exit 0
[[ -f "$file" ]] || exit 0

if command -v ruff >/dev/null 2>&1; then
  ruff=(ruff)
elif command -v uvx >/dev/null 2>&1; then
  ruff=(uvx ruff@0.16.9)
else
  exit 0  # ruff не встановлено — мовчки пропускаємо
fi

"${ruff[@]}" check --fix --select I --quiet "$file" || true
"${ruff[@]}" format --quiet "$file"
