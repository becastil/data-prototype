# Repository Cleanup Script (Windows PowerShell)
# Safely removes build artifacts and other generated files from the working tree
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/repo-clean.ps1 [-PurgeGitCache]

[CmdletBinding()]
param(
  [switch]$PurgeGitCache
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

Write-Info "Cleaning local build artifacts..."

$paths = @(
  ".next",
  ".next/cache",
  "dist",
  "out",
  "build",
  "**/*.tsbuildinfo",
  "tsconfig.tsbuildinfo"
)

foreach ($p in $paths) {
  try {
    if ($p -like "**/*") {
      Get-ChildItem -Path . -Recurse -Filter ($p -replace "\*\*/", "") -ErrorAction SilentlyContinue | ForEach-Object {
        if (Test-Path $_.FullName) {
          Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
        }
      }
    } else {
      if (Test-Path $p) {
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        Write-Ok "Removed $p"
      } else {
        Write-Warn "$p not found"
      }
    }
  } catch {
    Write-Warn "Skipped $p: $($_.Exception.Message)"
  }
}

if ($PurgeGitCache) {
  Write-Info "Purging tracked artifacts from git index (no file deletions on disk)..."
  $cmds = @(
    "git rm -r --cached .next",
    "git rm -r --cached tsconfig.tsbuildinfo",
    "git rm -r --cached **/*.tsbuildinfo"
  )
  foreach ($c in $cmds) {
    try {
      Write-Host "> $c" -ForegroundColor DarkGray
      iex $c | Out-Null
    } catch {
      Write-Warn "Git cache purge step failed or not applicable: $c"
    }
  }
  Write-Ok "Git cache purge attempted. Review 'git status' and commit removals."
}

Write-Ok "Cleanup complete."
