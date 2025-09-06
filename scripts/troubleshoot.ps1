# Healthcare Analytics Dashboard - Troubleshooting Script
# Compatible with PowerShell 5.1+ and PowerShell 7+
# Automated diagnostics and problem resolution

[CmdletBinding()]
param(
    [switch]$Fix,
    [switch]$Detailed,
    [switch]$Help,
    [switch]$Quiet,
    [string]$Issue = ""
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
    Write-ColorOutput "Healthcare Analytics Dashboard - Troubleshooting" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" $ColorWhite
    Write-ColorOutput "  .\scripts\troubleshoot.ps1 [OPTIONS]" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" $ColorWhite
    Write-ColorOutput "  -Fix              Attempt to automatically fix issues" $ColorYellow
    Write-ColorOutput "  -Detailed         Show detailed diagnostic information" $ColorYellow
    Write-ColorOutput "  -Issue <string>   Focus on specific issue type" $ColorYellow
    Write-ColorOutput "  -Quiet            Minimize output" $ColorYellow
    Write-ColorOutput "  -Help             Show this help message" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "ISSUE TYPES:" $ColorWhite
    Write-ColorOutput "  node              Node.js related issues" $ColorYellow
    Write-ColorOutput "  port              Port conflict issues" $ColorYellow
    Write-ColorOutput "  build             Build process issues" $ColorYellow
    Write-ColorOutput "  dependencies      npm/package issues" $ColorYellow
    Write-ColorOutput "  permissions       PowerShell/file permission issues" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" $ColorWhite
    Write-ColorOutput "  .\scripts\troubleshoot.ps1              # Run all diagnostics" $ColorYellow
    Write-ColorOutput "  .\scripts\troubleshoot.ps1 -Fix         # Run diagnostics and fix issues" $ColorYellow
    Write-ColorOutput "  .\scripts\troubleshoot.ps1 -Issue node  # Focus on Node.js issues" $ColorYellow
}

function Test-PowerShellVersion {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Checking PowerShell Version..." $ColorCyan
    
    $psVersion = $PSVersionTable.PSVersion
    Write-ColorOutput "PowerShell Version: $($psVersion.Major).$($psVersion.Minor).$($psVersion.Build)" $ColorWhite
    
    if ($psVersion.Major -lt 5) {
        $issues += "PowerShell version too old (found $($psVersion.Major).$($psVersion.Minor), need 5.1+)"
        Write-ColorOutput "✗ PowerShell version too old" $ColorRed
    } elseif ($psVersion.Major -eq 5 -and $psVersion.Minor -lt 1) {
        $issues += "PowerShell 5.0 found, recommend upgrading to 5.1+"
        Write-ColorOutput "⚠ PowerShell 5.0 found, recommend 5.1+" $ColorYellow
    } else {
        Write-ColorOutput "✓ PowerShell version is compatible" $ColorGreen
    }
    
    # Check execution policy
    $policy = Get-ExecutionPolicy
    Write-ColorOutput "Execution Policy: $policy" $ColorWhite
    
    if ($policy -eq "Restricted") {
        $issues += "PowerShell execution policy is restricted"
        Write-ColorOutput "✗ Execution policy is restricted" $ColorRed
        
        if ($Fix) {
            try {
                Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
                Write-ColorOutput "✓ Fixed: Updated execution policy" $ColorGreen
            } catch {
                Write-ColorOutput "✗ Failed to update execution policy" $ColorRed
            }
        }
    } else {
        Write-ColorOutput "✓ Execution policy allows script execution" $ColorGreen
    }
    
    return $issues
}

function Test-NodeJs {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Checking Node.js Installation..." $ColorCyan
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-ColorOutput "Node.js Version: $nodeVersion" $ColorWhite
            
            $versionNumber = $nodeVersion -replace 'v', ''
            $currentMajor = [int]($versionNumber.Split('.')[0])
            
            if ($currentMajor -lt 16) {
                $issues += "Node.js version too old (found v$versionNumber, need v16+)"
                Write-ColorOutput "✗ Node.js version too old" $ColorRed
            } else {
                Write-ColorOutput "✓ Node.js version is compatible" $ColorGreen
            }
            
            # Check npm version
            $npmVersion = npm --version 2>$null
            if ($npmVersion) {
                Write-ColorOutput "npm Version: $npmVersion" $ColorWhite
                Write-ColorOutput "✓ npm is available" $ColorGreen
            } else {
                $issues += "npm not found with Node.js installation"
                Write-ColorOutput "✗ npm not found" $ColorRed
            }
        } else {
            $issues += "Node.js not found"
            Write-ColorOutput "✗ Node.js not found" $ColorRed
        }
    } catch {
        $issues += "Error checking Node.js: $($_.Exception.Message)"
        Write-ColorOutput "✗ Error checking Node.js" $ColorRed
    }
    
    # Check PATH for Node.js
    $nodePaths = $env:PATH -split ';' | Where-Object { $_ -like "*node*" }
    if ($nodePaths) {
        Write-ColorOutput "Node.js paths in PATH:" $ColorWhite
        $nodePaths | ForEach-Object { Write-ColorOutput "  $_" $ColorYellow }
    }
    
    return $issues
}

function Test-ProjectStructure {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Checking Project Structure..." $ColorCyan
    
    # Check essential files
    $requiredFiles = @(
        "package.json",
        "next.config.ts",
        "tsconfig.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-ColorOutput "✓ Found $file" $ColorGreen
        } else {
            $issues += "Missing required file: $file"
            Write-ColorOutput "✗ Missing $file" $ColorRed
        }
    }
    
    # Check directories
    $requiredDirs = @(
        "app",
        "public"
    )
    
    foreach ($dir in $requiredDirs) {
        if (Test-Path $dir) {
            Write-ColorOutput "✓ Found $dir/ directory" $ColorGreen
        } else {
            $issues += "Missing required directory: $dir"
            Write-ColorOutput "✗ Missing $dir/ directory" $ColorRed
        }
    }
    
    # Check node_modules
    if (Test-Path "node_modules") {
        Write-ColorOutput "✓ Found node_modules" $ColorGreen
        
        # Check if it's empty or corrupt
        $nodeModulesCount = (Get-ChildItem "node_modules" -Directory -ErrorAction SilentlyContinue).Count
        if ($nodeModulesCount -lt 10) {
            $issues += "node_modules appears incomplete (only $nodeModulesCount packages)"
            Write-ColorOutput "⚠ node_modules may be incomplete" $ColorYellow
        }
    } else {
        $issues += "node_modules directory not found"
        Write-ColorOutput "✗ node_modules not found" $ColorRed
        
        if ($Fix) {
            Write-ColorOutput "Attempting to install dependencies..." $ColorCyan
            try {
                npm install
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✓ Fixed: Dependencies installed" $ColorGreen
                } else {
                    Write-ColorOutput "✗ Failed to install dependencies" $ColorRed
                }
            } catch {
                Write-ColorOutput "✗ Error installing dependencies: $($_.Exception.Message)" $ColorRed
            }
        }
    }
    
    return $issues
}

function Test-PortAvailability {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Checking Port Availability..." $ColorCyan
    
    $testPort = 3005
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $testPort -ErrorAction SilentlyContinue
        if ($connections) {
            $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            
            foreach ($pid in $processIds) {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        $issues += "Port $testPort is in use by $($process.ProcessName) (PID: $pid)"
                        Write-ColorOutput "⚠ Port $testPort in use by $($process.ProcessName)" $ColorYellow
                        
                        if ($Fix) {
                            $choice = Read-Host "Stop process $($process.ProcessName) (PID: $pid)? (y/n)"
                            if ($choice -match "^[Yy]") {
                                try {
                                    Stop-Process -Id $pid -Force
                                    Write-ColorOutput "✓ Fixed: Stopped process $($process.ProcessName)" $ColorGreen
                                } catch {
                                    Write-ColorOutput "✗ Failed to stop process" $ColorRed
                                }
                            }
                        }
                    }
                } catch {
                    Write-ColorOutput "⚠ Could not identify process using port $testPort" $ColorYellow
                }
            }
        } else {
            Write-ColorOutput "✓ Port $testPort is available" $ColorGreen
        }
    } catch {
        Write-ColorOutput "⚠ Could not check port availability (this is usually okay)" $ColorYellow
    }
    
    return $issues
}

function Test-Dependencies {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Checking Dependencies..." $ColorCyan
    
    if (-not (Test-Path "package.json")) {
        $issues += "package.json not found"
        return $issues
    }
    
    try {
        # Check for security issues
        Write-ColorOutput "Running security audit..." $ColorCyan
        $auditOutput = npm audit --audit-level moderate 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ No security vulnerabilities found" $ColorGreen
        } else {
            Write-ColorOutput "⚠ Security vulnerabilities found" $ColorYellow
            if ($Detailed) {
                Write-ColorOutput $auditOutput $ColorYellow
            }
            
            if ($Fix) {
                Write-ColorOutput "Attempting to fix security issues..." $ColorCyan
                npm audit fix 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-ColorOutput "✓ Fixed: Security issues resolved" $ColorGreen
                } else {
                    Write-ColorOutput "⚠ Some security issues could not be auto-fixed" $ColorYellow
                }
            }
        }
        
        # Check for outdated packages
        Write-ColorOutput "Checking for outdated packages..." $ColorCyan
        $outdatedOutput = npm outdated 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ All packages are up to date" $ColorGreen
        } else {
            Write-ColorOutput "⚠ Some packages are outdated" $ColorYellow
            if ($Detailed) {
                Write-ColorOutput $outdatedOutput $ColorYellow
            }
        }
        
    } catch {
        $issues += "Error checking dependencies: $($_.Exception.Message)"
        Write-ColorOutput "✗ Error checking dependencies" $ColorRed
    }
    
    return $issues
}

function Test-BuildProcess {
    $issues = @()
    
    Write-ColorOutput "`n🔍 Testing Build Process..." $ColorCyan
    
    try {
        # Test TypeScript compilation
        Write-ColorOutput "Checking TypeScript compilation..." $ColorCyan
        $tsOutput = npx tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ TypeScript compilation successful" $ColorGreen
        } else {
            Write-ColorOutput "⚠ TypeScript compilation has issues" $ColorYellow
            if ($Detailed) {
                Write-ColorOutput $tsOutput $ColorYellow
            }
        }
        
        # Test Next.js configuration
        Write-ColorOutput "Checking Next.js configuration..." $ColorCyan
        if (Test-Path "next.config.ts") {
            Write-ColorOutput "✓ Next.js configuration found" $ColorGreen
        } else {
            $issues += "next.config.ts not found"
            Write-ColorOutput "✗ next.config.ts not found" $ColorRed
        }
        
    } catch {
        $issues += "Error testing build process: $($_.Exception.Message)"
        Write-ColorOutput "✗ Error testing build process" $ColorRed
    }
    
    return $issues
}

function Show-CommonSolutions {
    Write-ColorOutput "`n🔧 Common Solutions:" $ColorCyan
    Write-ColorOutput ("-" * 40) $ColorCyan
    
    Write-ColorOutput "`n1. Node.js Issues:" $ColorWhite
    Write-ColorOutput "   - Download and install from: https://nodejs.org" $ColorYellow
    Write-ColorOutput "   - Restart PowerShell after installation" $ColorYellow
    Write-ColorOutput "   - Try: refreshenv (if using Chocolatey)" $ColorYellow
    
    Write-ColorOutput "`n2. Permission Issues:" $ColorWhite
    Write-ColorOutput "   - Run: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" $ColorYellow
    Write-ColorOutput "   - Run PowerShell as Administrator if needed" $ColorYellow
    
    Write-ColorOutput "`n3. Port Conflicts:" $ColorWhite
    Write-ColorOutput "   - Use: .\scripts\dev.ps1 -Force" $ColorYellow
    Write-ColorOutput "   - Or: .\scripts\dev.ps1 -Port 3000" $ColorYellow
    
    Write-ColorOutput "`n4. Dependency Issues:" $ColorWhite
    Write-ColorOutput "   - Try: npm cache clean --force" $ColorYellow
    Write-ColorOutput "   - Try: Remove-Item node_modules -Recurse -Force; npm install" $ColorYellow
    Write-ColorOutput "   - Try: npm install --legacy-peer-deps" $ColorYellow
    
    Write-ColorOutput "`n5. Build Issues:" $ColorWhite
    Write-ColorOutput "   - Try: .\scripts\build.ps1 -Clean" $ColorYellow
    Write-ColorOutput "   - Check for TypeScript errors" $ColorYellow
    Write-ColorOutput "   - Ensure all dependencies are installed" $ColorYellow
}

function Generate-DiagnosticReport {
    param([array]$AllIssues)
    
    $reportPath = "diagnostic-report.txt"
    $report = @()
    
    $report += "Healthcare Analytics Dashboard - Diagnostic Report"
    $report += "Generated: $(Get-Date)"
    $report += "Computer: $env:COMPUTERNAME"
    $report += "User: $env:USERNAME"
    $report += "PowerShell: $($PSVersionTable.PSVersion)"
    $report += ""
    
    if ($AllIssues.Count -gt 0) {
        $report += "ISSUES FOUND:"
        $AllIssues | ForEach-Object { $report += "- $_" }
    } else {
        $report += "No issues detected."
    }
    
    $report += ""
    $report += "SYSTEM INFORMATION:"
    $report += "- OS: $((Get-WmiObject Win32_OperatingSystem).Caption)"
    $report += "- PowerShell Version: $($PSVersionTable.PSVersion)"
    $report += "- Execution Policy: $(Get-ExecutionPolicy)"
    
    try {
        $nodeVersion = node --version 2>$null
        $report += "- Node.js: $nodeVersion"
    } catch {
        $report += "- Node.js: Not found"
    }
    
    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-ColorOutput "✓ Diagnostic report saved to: $reportPath" $ColorGreen
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-ColorOutput "🏥 Healthcare Analytics Dashboard - Troubleshooting" $ColorCyan
    Write-ColorOutput ("-" * 60) $ColorCyan
    
    $allIssues = @()
    
    # Run diagnostics based on issue type or all
    if ($Issue -eq "" -or $Issue -eq "permissions") {
        $allIssues += Test-PowerShellVersion
    }
    
    if ($Issue -eq "" -or $Issue -eq "node") {
        $allIssues += Test-NodeJs
    }
    
    if ($Issue -eq "" -or $Issue -eq "dependencies") {
        $allIssues += Test-ProjectStructure
        $allIssues += Test-Dependencies
    }
    
    if ($Issue -eq "" -or $Issue -eq "port") {
        $allIssues += Test-PortAvailability
    }
    
    if ($Issue -eq "" -or $Issue -eq "build") {
        $allIssues += Test-BuildProcess
    }
    
    # Summary
    Write-ColorOutput "`n" + "=" * 60 $ColorCyan
    if ($allIssues.Count -eq 0) {
        Write-ColorOutput "✅ No issues detected!" $ColorGreen
        Write-ColorOutput "Your system appears to be ready for development." $ColorGreen
        Write-ColorOutput "`nNext steps:" $ColorWhite
        Write-ColorOutput "1. Run: .\scripts\dev.ps1" $ColorYellow
        Write-ColorOutput "2. Open: http://localhost:3005" $ColorYellow
    } else {
        Write-ColorOutput "⚠ Found $($allIssues.Count) potential issue(s):" $ColorYellow
        $allIssues | ForEach-Object { Write-ColorOutput "  • $_" $ColorRed }
        
        if (-not $Fix) {
            Write-ColorOutput "`nRun with -Fix flag to attempt automatic repairs." $ColorCyan
        }
        
        Show-CommonSolutions
    }
    
    # Generate report if detailed
    if ($Detailed) {
        Generate-DiagnosticReport -AllIssues $allIssues
    }

} catch {
    Write-ColorOutput "✗ Troubleshooting script error: $($_.Exception.Message)" $ColorRed
    Write-ColorOutput "`nFor manual troubleshooting:" $ColorYellow
    Write-ColorOutput "1. Check README.md for manual setup steps" $ColorYellow
    Write-ColorOutput "2. Verify Node.js is installed: node --version" $ColorYellow
    Write-ColorOutput "3. Check PowerShell version: `$PSVersionTable.PSVersion" $ColorYellow
    exit 1
}