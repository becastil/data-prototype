# Healthcare Analytics Dashboard - Development Server Script
# Compatible with PowerShell 5.1+ and PowerShell 7+
# Handles port conflicts and provides user-friendly feedback

[CmdletBinding()]
param(
    [int]$Port = 3005,
    [switch]$Force,
    [switch]$OpenBrowser,
    [switch]$Help,
    [switch]$Quiet
)

# Set error handling
$ErrorActionPreference = "Stop"

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
    Write-ColorOutput "Healthcare Analytics Dashboard - Development Server" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" $ColorWhite
    Write-ColorOutput "  .\scripts\dev.ps1 [OPTIONS]" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" $ColorWhite
    Write-ColorOutput "  -Port <number>    Port number to use (default: 3005)" $ColorYellow
    Write-ColorOutput "  -Force            Force start even if port is in use" $ColorYellow
    Write-ColorOutput "  -OpenBrowser      Automatically open browser" $ColorYellow
    Write-ColorOutput "  -Quiet            Minimize output" $ColorYellow
    Write-ColorOutput "  -Help             Show this help message" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" $ColorWhite
    Write-ColorOutput "  .\scripts\dev.ps1                    # Start on default port 3005" $ColorYellow
    Write-ColorOutput "  .\scripts\dev.ps1 -Port 3000         # Start on port 3000" $ColorYellow
    Write-ColorOutput "  .\scripts\dev.ps1 -Force -OpenBrowser # Force start and open browser" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "TROUBLESHOOTING:" $ColorWhite
    Write-ColorOutput "  If you have issues, run: .\scripts\troubleshoot.ps1" $ColorYellow
}

function Test-PortInUse {
    param([int]$PortNumber)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue
        return $connections.Count -gt 0
    } catch {
        # Fallback method for older PowerShell versions
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $PortNumber)
            $listener.Start()
            $listener.Stop()
            return $false
        } catch {
            return $true
        }
    }
}

function Get-ProcessUsingPort {
    param([int]$PortNumber)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue
        if ($connections) {
            $processId = $connections[0].OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                return @{
                    ProcessId = $processId
                    ProcessName = $process.ProcessName
                    CommandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue).CommandLine
                }
            }
        }
    } catch {
        # Fallback for older systems
        try {
            $netstat = netstat -ano | Select-String ":$PortNumber "
            if ($netstat) {
                $processId = ($netstat -split '\s+')[-1]
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    return @{
                        ProcessId = $processId
                        ProcessName = $process.ProcessName
                        CommandLine = ""
                    }
                }
            }
        } catch {
            return $null
        }
    }
    return $null
}

function Stop-ProcessOnPort {
    param([int]$PortNumber)
    
    $processInfo = Get-ProcessUsingPort -PortNumber $PortNumber
    if ($processInfo) {
        Write-ColorOutput "Found process using port $PortNumber:" $ColorYellow
        Write-ColorOutput "  Process ID: $($processInfo.ProcessId)" $ColorYellow
        Write-ColorOutput "  Process Name: $($processInfo.ProcessName)" $ColorYellow
        
        if ($Force -or (Read-Host "Stop this process? (y/n)") -match "^[Yy]") {
            try {
                Stop-Process -Id $processInfo.ProcessId -Force
                Start-Sleep -Seconds 2
                Write-ColorOutput "✓ Process stopped successfully" $ColorGreen
                return $true
            } catch {
                Write-ColorOutput "✗ Failed to stop process: $($_.Exception.Message)" $ColorRed
                return $false
            }
        } else {
            Write-ColorOutput "Process not stopped. Try using a different port with -Port parameter." $ColorYellow
            return $false
        }
    }
    return $true
}

function Find-AvailablePort {
    param([int]$StartPort = 3005)
    
    for ($testPort = $StartPort; $testPort -le ($StartPort + 50); $testPort++) {
        if (-not (Test-PortInUse -PortNumber $testPort)) {
            return $testPort
        }
    }
    return $null
}

function Test-Prerequisites {
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "✗ package.json not found" $ColorRed
        Write-ColorOutput "Make sure you're running this from the project root directory" $ColorYellow
        return $false
    }
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "⚠ node_modules not found" $ColorYellow
        Write-ColorOutput "Running npm install..." $ColorCyan
        
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "✗ npm install failed" $ColorRed
                Write-ColorOutput "Try running: .\scripts\install.ps1" $ColorYellow
                return $false
            }
        } catch {
            Write-ColorOutput "✗ Error running npm install: $($_.Exception.Message)" $ColorRed
            return $false
        }
    }
    
    # Check Node.js version
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✓ Node.js $nodeVersion detected" $ColorGreen
    } catch {
        Write-ColorOutput "✗ Node.js not found" $ColorRed
        Write-ColorOutput "Please install Node.js from https://nodejs.org or run .\scripts\install.ps1" $ColorYellow
        return $false
    }
    
    return $true
}

function Start-DevServer {
    param([int]$PortNumber)
    
    Write-ColorOutput "Starting development server on port $PortNumber..." $ColorCyan
    
    try {
        # Set the port in environment
        $env:PORT = $PortNumber
        
        # Start the development server
        Write-ColorOutput "🚀 Healthcare Analytics Dashboard starting..." $ColorGreen
        Write-ColorOutput "📍 Local server: http://localhost:$PortNumber" $ColorCyan
        Write-ColorOutput "📊 Upload your CSV files to view the dashboard" $ColorCyan
        Write-ColorOutput ""
        Write-ColorOutput "Press Ctrl+C to stop the server" $ColorYellow
        Write-ColorOutput ("-" * 50) $ColorCyan
        
        # Open browser if requested
        if ($OpenBrowser) {
            Start-Sleep -Seconds 3
            Start-Process "http://localhost:$PortNumber"
        }
        
        # Run npm dev command
        npm run dev
        
    } catch {
        Write-ColorOutput "✗ Failed to start development server: $($_.Exception.Message)" $ColorRed
        Write-ColorOutput "Try running: .\scripts\troubleshoot.ps1" $ColorYellow
        return $false
    }
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-ColorOutput "🏥 Healthcare Analytics Dashboard - Development Mode" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    # Check if port is in use
    if (Test-PortInUse -PortNumber $Port) {
        Write-ColorOutput "⚠ Port $Port is already in use" $ColorYellow
        
        if ($Force) {
            Write-ColorOutput "Force mode enabled - attempting to stop process..." $ColorCyan
            if (-not (Stop-ProcessOnPort -PortNumber $Port)) {
                # Try to find alternative port
                $alternativePort = Find-AvailablePort -StartPort ($Port + 1)
                if ($alternativePort) {
                    Write-ColorOutput "Using alternative port: $alternativePort" $ColorCyan
                    $Port = $alternativePort
                } else {
                    Write-ColorOutput "✗ No available ports found" $ColorRed
                    exit 1
                }
            }
        } else {
            $processInfo = Get-ProcessUsingPort -PortNumber $Port
            if ($processInfo) {
                Write-ColorOutput "Process using port $Port: $($processInfo.ProcessName) (PID: $($processInfo.ProcessId))" $ColorYellow
            }
            
            Write-ColorOutput "Options:" $ColorWhite
            Write-ColorOutput "1. Use -Force to automatically stop the process" $ColorYellow
            Write-ColorOutput "2. Use -Port <number> to use a different port" $ColorYellow
            Write-ColorOutput "3. Manually stop the process and try again" $ColorYellow
            
            $choice = Read-Host "`nChoose action: (f)orce, (p)ort, (q)uit"
            
            switch ($choice.ToLower()) {
                "f" { 
                    if (-not (Stop-ProcessOnPort -PortNumber $Port)) {
                        exit 1
                    }
                }
                "p" {
                    $alternativePort = Find-AvailablePort -StartPort ($Port + 1)
                    if ($alternativePort) {
                        Write-ColorOutput "Using alternative port: $alternativePort" $ColorCyan
                        $Port = $alternativePort
                    } else {
                        Write-ColorOutput "✗ No available ports found" $ColorRed
                        exit 1
                    }
                }
                default {
                    Write-ColorOutput "Operation cancelled" $ColorYellow
                    exit 0
                }
            }
        }
    }
    
    # Start the development server
    Start-DevServer -PortNumber $Port

} catch {
    Write-ColorOutput "✗ Unexpected error: $($_.Exception.Message)" $ColorRed
    Write-ColorOutput "`nFor troubleshooting help, run: .\scripts\troubleshoot.ps1" $ColorYellow
    exit 1
}