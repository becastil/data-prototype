# Healthcare Analytics Dashboard - Cleanup/Uninstall Script
# Compatible with PowerShell 5.1+ and PowerShell 7+
# Safely removes build artifacts and optionally uninstalls the project

[CmdletBinding()]
param(
    [switch]$Full,
    [switch]$Dependencies,
    [switch]$Cache,
    [switch]$Build,
    [switch]$Logs,
    [switch]$Force,
    [switch]$Help,
    [switch]$Quiet
)

# Set error handling
$ErrorActionPreference = "Continue"

# Colors for output
$ColorGreen = "Green"
$ColorRed = "Red"
$ColorYellow = "Yellow"
$ColorCyan = "Cyan"
$ColorWhite = "White"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    if (-not $Quiet) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Show-Help {
    Write-ColorOutput "Healthcare Analytics Dashboard - Cleanup/Uninstall" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" $ColorWhite
    Write-ColorOutput "  .\scripts\cleanup.ps1 [OPTIONS]" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" $ColorWhite
    Write-ColorOutput "  -Full             Complete uninstall (removes everything)" $ColorYellow
    Write-ColorOutput "  -Dependencies     Remove node_modules and package-lock.json" $ColorYellow
    Write-ColorOutput "  -Cache            Clear npm and build caches" $ColorYellow
    Write-ColorOutput "  -Build            Remove build artifacts (.next, dist, out)" $ColorYellow
    Write-ColorOutput "  -Logs             Remove log files and diagnostic reports" $ColorYellow
    Write-ColorOutput "  -Force            Skip confirmation prompts" $ColorYellow
    Write-ColorOutput "  -Quiet            Minimize output" $ColorYellow
    Write-ColorOutput "  -Help             Show this help message" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" $ColorWhite
    Write-ColorOutput "  .\scripts\cleanup.ps1                  # Clean build artifacts only" $ColorYellow
    Write-ColorOutput "  .\scripts\cleanup.ps1 -Cache          # Clear caches" $ColorYellow
    Write-ColorOutput "  .\scripts\cleanup.ps1 -Dependencies   # Remove node_modules" $ColorYellow
    Write-ColorOutput "  .\scripts\cleanup.ps1 -Full -Force    # Complete uninstall" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "SAFETY:" $ColorWhite
    Write-ColorOutput "  This script will ask for confirmation unless -Force is used." $ColorYellow
    Write-ColorOutput "  Your source code and configuration files are never deleted." $ColorYellow
}

function Get-DirectorySize {
    param([string]$Path)
    
    if (Test-Path $Path) {
        try {
            $size = Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | 
                   Measure-Object -Property Length -Sum
            return [math]::Round($size.Sum / 1MB, 2)
        } catch {
            return 0
        }
    }
    return 0
}

function Remove-DirectorySafe {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        $sizeMB = Get-DirectorySize -Path $Path
        Write-ColorOutput "Found $Description ($sizeMB MB)" $ColorWhite
        
        if ($Force -or (Read-Host "Remove $Description? (y/n)") -match "^[Yy]") {
            try {
                Remove-Item $Path -Recurse -Force
                Write-ColorOutput "✓ Removed $Description" $ColorGreen
                return $true
            } catch {
                Write-ColorOutput "✗ Failed to remove $Description : $($_.Exception.Message)" $ColorRed
                return $false
            }
        } else {
            Write-ColorOutput "⚠ Skipped $Description" $ColorYellow
            return $false
        }
    } else {
        Write-ColorOutput "✓ $Description not found (already clean)" $ColorGreen
        return $true
    }
}

function Remove-FileSafe {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        $sizeKB = [math]::Round((Get-Item $Path).Length / 1KB, 1)
        Write-ColorOutput "Found $Description ($sizeKB KB)" $ColorWhite
        
        if ($Force -or (Read-Host "Remove $Description? (y/n)") -match "^[Yy]") {
            try {
                Remove-Item $Path -Force
                Write-ColorOutput "✓ Removed $Description" $ColorGreen
                return $true
            } catch {
                Write-ColorOutput "✗ Failed to remove $Description : $($_.Exception.Message)" $ColorRed
                return $false
            }
        } else {
            Write-ColorOutput "⚠ Skipped $Description" $ColorYellow
            return $false
        }
    } else {
        Write-ColorOutput "✓ $Description not found (already clean)" $ColorGreen
        return $true
    }
}

function Clean-BuildArtifacts {
    Write-ColorOutput "`n🧹 Cleaning Build Artifacts..." $ColorCyan
    
    $totalFreed = 0
    $buildPaths = @(
        @{ Path = ".next"; Description = ".next build directory" },
        @{ Path = "out"; Description = "out export directory" },
        @{ Path = "dist"; Description = "dist build directory" },
        @{ Path = "build"; Description = "build directory" },
        @{ Path = ".nuxt"; Description = ".nuxt cache directory" },
        @{ Path = ".output"; Description = ".output directory" }
    )
    
    foreach ($item in $buildPaths) {
        if (Test-Path $item.Path) {
            $sizeMB = Get-DirectorySize -Path $item.Path
            $totalFreed += $sizeMB
        }
        Remove-DirectorySafe -Path $item.Path -Description $item.Description | Out-Null
    }
    
    # Remove TypeScript build info
    $tsBuildFiles = @(
        "tsconfig.tsbuildinfo",
        ".tsbuildinfo"
    )
    
    foreach ($file in $tsBuildFiles) {
        Remove-FileSafe -Path $file -Description "TypeScript build info" | Out-Null
    }
    
    if ($totalFreed -gt 0) {
        Write-ColorOutput "💾 Freed approximately $totalFreed MB from build artifacts" $ColorGreen
    }
}

function Clean-Dependencies {
    Write-ColorOutput "`n🧹 Cleaning Dependencies..." $ColorCyan
    
    $totalFreed = 0
    
    # Remove node_modules
    if (Test-Path "node_modules") {
        $sizeMB = Get-DirectorySize -Path "node_modules"
        $totalFreed += $sizeMB
        
        Write-ColorOutput "Found node_modules ($sizeMB MB)" $ColorWhite
        Write-ColorOutput "⚠ This will require reinstalling dependencies with npm install" $ColorYellow
        
        Remove-DirectorySafe -Path "node_modules" -Description "node_modules directory" | Out-Null
    }
    
    # Remove package-lock.json
    Remove-FileSafe -Path "package-lock.json" -Description "package-lock.json" | Out-Null
    
    # Remove yarn.lock if exists
    Remove-FileSafe -Path "yarn.lock" -Description "yarn.lock" | Out-Null
    
    if ($totalFreed -gt 0) {
        Write-ColorOutput "💾 Freed approximately $totalFreed MB from dependencies" $ColorGreen
    }
}

function Clean-Cache {
    Write-ColorOutput "`n🧹 Cleaning Caches..." $ColorCyan
    
    # Clear npm cache
    try {
        Write-ColorOutput "Clearing npm cache..." $ColorCyan
        npm cache clean --force 2>$null
        Write-ColorOutput "✓ Cleared npm cache" $ColorGreen
    } catch {
        Write-ColorOutput "⚠ Could not clear npm cache" $ColorYellow
    }
    
    # Clear Next.js cache
    $cachePaths = @(
        @{ Path = ".next/cache"; Description = "Next.js cache" },
        @{ Path = "node_modules/.cache"; Description = "Node modules cache" },
        @{ Path = "$env:TEMP/next-*"; Description = "Next.js temp files" }
    )
    
    foreach ($item in $cachePaths) {
        if ($item.Path -like "*/*") {
            # Handle wildcard paths
            Get-ChildItem $item.Path -ErrorAction SilentlyContinue | ForEach-Object {
                Remove-DirectorySafe -Path $_.FullName -Description $item.Description | Out-Null
            }
        } else {
            Remove-DirectorySafe -Path $item.Path -Description $item.Description | Out-Null
        }
    }
    
    # Clear browser cache for localhost (if possible)
    try {
        Write-ColorOutput "Note: You may want to clear your browser cache for localhost:3005" $ColorCyan
    } catch {}
}

function Clean-Logs {
    Write-ColorOutput "`n🧹 Cleaning Logs and Reports..." $ColorCyan
    
    $logFiles = @(
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "lerna-debug.log*",
        "diagnostic-report.txt",
        "lighthouse-results.*",
        "coverage/",
        ".nyc_output/"
    )
    
    foreach ($pattern in $logFiles) {
        if ($pattern -like "*/*") {
            # Directory
            Remove-DirectorySafe -Path $pattern -Description "log directory" | Out-Null
        } else {
            # File pattern
            Get-ChildItem $pattern -ErrorAction SilentlyContinue | ForEach-Object {
                Remove-FileSafe -Path $_.FullName -Description "log file" | Out-Null
            }
        }
    }
}

function Full-Uninstall {
    Write-ColorOutput "`n🗑️ Full Uninstall Mode..." $ColorCyan
    Write-ColorOutput "This will remove ALL generated files and dependencies." $ColorYellow
    Write-ColorOutput "Your source code will NOT be deleted." $ColorGreen
    
    if (-not $Force) {
        $confirmation = Read-Host "`nAre you sure you want to proceed with full uninstall? (type 'YES' to confirm)"
        if ($confirmation -ne "YES") {
            Write-ColorOutput "Full uninstall cancelled." $ColorYellow
            return
        }
    }
    
    # Run all cleanup operations
    Clean-BuildArtifacts
    Clean-Dependencies
    Clean-Cache
    Clean-Logs
    
    # Additional full uninstall items
    $additionalPaths = @(
        @{ Path = ".env.local"; Description = "local environment file" },
        @{ Path = ".env.production.local"; Description = "production environment file" },
        @{ Path = "*.tgz"; Description = "npm package archives" }
    )
    
    foreach ($item in $additionalPaths) {
        if ($item.Path -like "*.*") {
            # File pattern
            Get-ChildItem $item.Path -ErrorAction SilentlyContinue | ForEach-Object {
                Remove-FileSafe -Path $_.FullName -Description $item.Description | Out-Null
            }
        } else {
            Remove-FileSafe -Path $item.Path -Description $item.Description | Out-Null
        }
    }
    
    Write-ColorOutput "`n✅ Full uninstall completed!" $ColorGreen
    Write-ColorOutput "To reinstall, run: .\scripts\install.ps1" $ColorCyan
}

function Show-CleanupSummary {
    Write-ColorOutput "`n" + "=" * 50 $ColorCyan
    Write-ColorOutput "🧹 Cleanup Summary" $ColorCyan
    Write-ColorOutput "=" * 50 $ColorCyan
    
    # Check what's left
    $remainingItems = @()
    
    if (Test-Path "node_modules") { $remainingItems += "node_modules ($(Get-DirectorySize 'node_modules') MB)" }
    if (Test-Path ".next") { $remainingItems += ".next build cache" }
    if (Test-Path "package-lock.json") { $remainingItems += "package-lock.json" }
    
    if ($remainingItems.Count -eq 0) {
        Write-ColorOutput "✓ Project is fully cleaned" $ColorGreen
        Write-ColorOutput "`nTo start fresh:" $ColorWhite
        Write-ColorOutput "1. Run: .\scripts\install.ps1" $ColorYellow
        Write-ColorOutput "2. Run: .\scripts\dev.ps1" $ColorYellow
    } else {
        Write-ColorOutput "Remaining items:" $ColorWhite
        $remainingItems | ForEach-Object { Write-ColorOutput "  • $_" $ColorYellow }
        
        Write-ColorOutput "`nTo clean everything:" $ColorWhite
        Write-ColorOutput "  .\scripts\cleanup.ps1 -Full" $ColorYellow
    }
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-ColorOutput "🏥 Healthcare Analytics Dashboard - Cleanup" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    
    if ($Full) {
        Full-Uninstall
    } else {
        # Default behavior or specific cleanup operations
        if (-not ($Dependencies -or $Cache -or $Build -or $Logs)) {
            # Default: clean build artifacts
            $Build = $true
        }
        
        if ($Build) {
            Clean-BuildArtifacts
        }
        
        if ($Dependencies) {
            Clean-Dependencies
        }
        
        if ($Cache) {
            Clean-Cache
        }
        
        if ($Logs) {
            Clean-Logs
        }
        
        Show-CleanupSummary
    }
    
    Write-ColorOutput "`n✅ Cleanup completed!" $ColorGreen

} catch {
    Write-ColorOutput "✗ Cleanup failed: $($_.Exception.Message)" $ColorRed
    Write-ColorOutput "`nYou can manually delete these directories/files:" $ColorYellow
    Write-ColorOutput "- node_modules/" $ColorYellow
    Write-ColorOutput "- .next/" $ColorYellow
    Write-ColorOutput "- package-lock.json" $ColorYellow
    exit 1
}