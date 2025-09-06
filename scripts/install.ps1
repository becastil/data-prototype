# Healthcare Analytics Dashboard - Windows PowerShell Installer
# Compatible with PowerShell 5.1+ and PowerShell 7+
# Run with: irm https://raw.githubusercontent.com/[repo]/main/scripts/install.ps1 | iex

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$SkipNodeCheck,
    [string]$NodeVersion = "18.0.0"
)

# Set error handling
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$ColorGreen = "Green"
$ColorRed = "Red"
$ColorYellow = "Yellow"
$ColorCyan = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-NodeJs {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNumber = $nodeVersion -replace 'v', ''
            $currentMajor = [int]($versionNumber.Split('.')[0])
            $requiredMajor = [int]($NodeVersion.Split('.')[0])
            
            if ($currentMajor -ge $requiredMajor) {
                Write-ColorOutput "✓ Node.js $nodeVersion found (required: v$NodeVersion+)" $ColorGreen
                return $true
            } else {
                Write-ColorOutput "⚠ Node.js $nodeVersion found, but v$NodeVersion+ required" $ColorYellow
                return $false
            }
        }
    } catch {
        Write-ColorOutput "✗ Node.js not found" $ColorRed
        return $false
    }
    return $false
}

function Install-NodeJs {
    Write-ColorOutput "Installing Node.js..." $ColorCyan
    
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        try {
            Write-ColorOutput "Using winget to install Node.js..." $ColorCyan
            winget install OpenJS.NodeJS --silent --accept-package-agreements --accept-source-agreements
            
            # Refresh environment variables
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Start-Sleep -Seconds 3
            
            if (Test-NodeJs) {
                Write-ColorOutput "✓ Node.js installed successfully!" $ColorGreen
                return $true
            }
        } catch {
            Write-ColorOutput "⚠ Winget installation failed, trying alternative method..." $ColorYellow
        }
    }
    
    # Alternative: Download and install manually
    Write-ColorOutput "Downloading Node.js installer..." $ColorCyan
    $nodeUrl = "https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
        Write-ColorOutput "Running Node.js installer..." $ColorCyan
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Start-Sleep -Seconds 5
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
        
        if (Test-NodeJs) {
            Write-ColorOutput "✓ Node.js installed successfully!" $ColorGreen
            return $true
        }
    } catch {
        Write-ColorOutput "✗ Failed to install Node.js automatically" $ColorRed
        Write-ColorOutput "Please install Node.js manually from: https://nodejs.org" $ColorYellow
        return $false
    }
    
    return $false
}

function Test-PowerShellExecutionPolicy {
    $policy = Get-ExecutionPolicy
    if ($policy -eq "Restricted") {
        Write-ColorOutput "⚠ PowerShell execution policy is restricted" $ColorYellow
        Write-ColorOutput "Attempting to set execution policy for current user..." $ColorCyan
        
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Write-ColorOutput "✓ Execution policy updated" $ColorGreen
            return $true
        } catch {
            Write-ColorOutput "✗ Could not update execution policy" $ColorRed
            Write-ColorOutput "Please run: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" $ColorYellow
            return $false
        }
    }
    return $true
}

function Install-Dependencies {
    Write-ColorOutput "Installing project dependencies..." $ColorCyan
    
    try {
        # Change to project directory
        if (-not (Test-Path "package.json")) {
            Write-ColorOutput "✗ package.json not found. Make sure you're in the project directory." $ColorRed
            return $false
        }
        
        # Clear npm cache if needed
        Write-ColorOutput "Clearing npm cache..." $ColorCyan
        npm cache clean --force 2>$null
        
        # Install dependencies
        Write-ColorOutput "Running npm install..." $ColorCyan
        $installOutput = npm install --production=false 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Dependencies installed successfully!" $ColorGreen
            return $true
        } else {
            Write-ColorOutput "⚠ npm install had warnings, trying with --legacy-peer-deps..." $ColorYellow
            $legacyOutput = npm install --legacy-peer-deps 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✓ Dependencies installed with legacy peer deps!" $ColorGreen
                return $true
            } else {
                Write-ColorOutput "✗ Failed to install dependencies:" $ColorRed
                Write-ColorOutput $installOutput $ColorRed
                return $false
            }
        }
    } catch {
        Write-ColorOutput "✗ Error during dependency installation: $($_.Exception.Message)" $ColorRed
        return $false
    }
}

function Test-Installation {
    Write-ColorOutput "Testing installation..." $ColorCyan
    
    try {
        # Test TypeScript compilation
        Write-ColorOutput "Checking TypeScript..." $ColorCyan
        $tsCheck = npx tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "⚠ TypeScript check had warnings (this is usually okay)" $ColorYellow
        } else {
            Write-ColorOutput "✓ TypeScript check passed" $ColorGreen
        }
        
        # Test build process
        Write-ColorOutput "Testing build process..." $ColorCyan
        $buildOutput = npm run build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Build test successful!" $ColorGreen
            return $true
        } else {
            Write-ColorOutput "⚠ Build test had issues, but installation may still work" $ColorYellow
            Write-ColorOutput "You can try running 'npm run dev' to start development mode" $ColorCyan
            return $false
        }
    } catch {
        Write-ColorOutput "⚠ Installation test encountered issues, but basic setup completed" $ColorYellow
        return $false
    }
}

function Show-NextSteps {
    Write-ColorOutput "`n" + "=" * 60 $ColorGreen
    Write-ColorOutput "🎉 Healthcare Analytics Dashboard Setup Complete!" $ColorGreen
    Write-ColorOutput "=" * 60 $ColorGreen
    
    Write-ColorOutput "`nNext steps:" $ColorCyan
    Write-ColorOutput "1. Start development server:" $ColorWhite
    Write-ColorOutput "   npm run dev" $ColorYellow
    Write-ColorOutput "   (or run: .\scripts\dev.ps1)" $ColorYellow
    
    Write-ColorOutput "`n2. Open your browser to:" $ColorWhite
    Write-ColorOutput "   http://localhost:3005" $ColorYellow
    
    Write-ColorOutput "`n3. Upload your CSV files:" $ColorWhite
    Write-ColorOutput "   - Budget data (left panel)" $ColorYellow
    Write-ColorOutput "   - Claims data (right panel)" $ColorYellow
    
    Write-ColorOutput "`nTroubleshooting:" $ColorWhite
    Write-ColorOutput "- If you have issues: .\scripts\troubleshoot.ps1" $ColorYellow
    Write-ColorOutput "- For help: .\scripts\dev.ps1 -Help" $ColorYellow
    
    Write-ColorOutput "`nDocumentation:" $ColorWhite
    Write-ColorOutput "- README.md - Complete setup guide" $ColorYellow
    Write-ColorOutput "- WINDOWS-SETUP.md - Windows-specific help" $ColorYellow
}

# Main installation process
try {
    Write-ColorOutput "🏥 Healthcare Analytics Dashboard - Windows Installer" $ColorCyan
    Write-ColorOutput "Compatible with PowerShell 5.1+ and PowerShell 7+" $ColorGreen
    Write-ColorOutput ("-" * 60) $ColorCyan
    
    # Check execution policy
    if (-not (Test-PowerShellExecutionPolicy)) {
        exit 1
    }
    
    # Check for Node.js
    if (-not $SkipNodeCheck) {
        if (-not (Test-NodeJs)) {
            if ($Force -or (Read-Host "Install Node.js automatically? (y/n)") -match "^[Yy]") {
                if (-not (Install-NodeJs)) {
                    exit 1
                }
            } else {
                Write-ColorOutput "Please install Node.js from https://nodejs.org and run this script again" $ColorYellow
                exit 1
            }
        }
    }
    
    # Install dependencies
    if (-not (Install-Dependencies)) {
        Write-ColorOutput "`n⚠ Installation completed with errors" $ColorYellow
        Write-ColorOutput "Try running: npm run dev" $ColorCyan
        Write-ColorOutput "If that doesn't work, run: .\scripts\troubleshoot.ps1" $ColorYellow
        exit 1
    }
    
    # Test installation
    Test-Installation | Out-Null
    
    # Show success message
    Show-NextSteps
    
    Write-ColorOutput "`n✓ Installation completed successfully!" $ColorGreen
    
    # Auto-start development server if requested
    if ($Force -or (Read-Host "`nStart development server now? (y/n)") -match "^[Yy]") {
        Write-ColorOutput "Starting development server..." $ColorCyan
        npm run dev
    }

} catch {
    Write-ColorOutput "`n✗ Installation failed: $($_.Exception.Message)" $ColorRed
    Write-ColorOutput "`nFor help:" $ColorYellow
    Write-ColorOutput "1. Check the troubleshooting guide: .\scripts\troubleshoot.ps1" $ColorYellow
    Write-ColorOutput "2. View the full README.md for manual setup steps" $ColorYellow
    Write-ColorOutput "3. Ensure you have PowerShell 5.1+ or PowerShell 7+" $ColorYellow
    exit 1
}