# PowerShell Commands Reference

Quick reference for all Windows PowerShell commands and scripts.

## Quick Start Commands

```powershell
# Install everything automatically
irm https://raw.githubusercontent.com/your-repo/main/scripts/install.ps1 | iex

# Start the dashboard
npm run dev

# Open in browser: http://localhost:3005
```

## PowerShell Scripts

### Installation Script
```powershell
./scripts/install.ps1                    # Install everything
./scripts/install.ps1 -Help              # Show help
./scripts/install.ps1 -Force             # Skip confirmations
./scripts/install.ps1 -SkipNodeCheck     # Skip Node.js check
```

### Development Server Script
```powershell
./scripts/dev.ps1                        # Start on port 3005
./scripts/dev.ps1 -Port 3000            # Use different port
./scripts/dev.ps1 -Force                # Kill conflicting processes
./scripts/dev.ps1 -OpenBrowser          # Auto-open browser
./scripts/dev.ps1 -Help                 # Show help
```

### Build Script
```powershell
./scripts/build.ps1                      # Production build
./scripts/build.ps1 -Analyze            # Build with bundle analyzer
./scripts/build.ps1 -Clean              # Clean before build
./scripts/build.ps1 -Test               # Build and test
./scripts/build.ps1 -Production         # Optimized build
./scripts/build.ps1 -Help               # Show help
```

### Troubleshooting Script
```powershell
./scripts/troubleshoot.ps1               # Check everything
./scripts/troubleshoot.ps1 -Fix          # Auto-fix issues
./scripts/troubleshoot.ps1 -Detailed     # Verbose output
./scripts/troubleshoot.ps1 -Issue node   # Check specific issue
./scripts/troubleshoot.ps1 -Help         # Show help
```

**Issue Types:**
- `node` - Node.js related issues
- `port` - Port conflict issues  
- `build` - Build process issues
- `dependencies` - Package issues
- `permissions` - PowerShell permissions

### Cleanup Script
```powershell
./scripts/cleanup.ps1                    # Clean build files
./scripts/cleanup.ps1 -Full             # Complete uninstall
./scripts/cleanup.ps1 -Dependencies     # Remove node_modules
./scripts/cleanup.ps1 -Cache            # Clear caches
./scripts/cleanup.ps1 -Force            # Skip confirmations
./scripts/cleanup.ps1 -Help             # Show help
```

## NPM Commands

### Basic Commands
```powershell
npm install                              # Install dependencies
npm run dev                             # Start development server
npm run build                           # Build for production
npm start                              # Run production server
npm run lint                           # Check code quality
```

### Windows-Specific NPM Scripts
```powershell
npm run win:install                     # Windows installer
npm run win:dev                        # Windows dev server
npm run win:build                      # Windows build
npm run win:build:analyze              # Windows build with analysis
npm run win:troubleshoot               # Windows troubleshooting
npm run win:cleanup                    # Windows cleanup
npm run win:help                       # Windows help
```

### Bundle Analysis
```powershell
npm run build:analyze                   # Cross-platform
npm run build:analyze:win             # Windows-specific
```

## Troubleshooting Commands

### Check System Status
```powershell
# Check PowerShell version
$PSVersionTable.PSVersion

# Check Node.js and npm
node --version
npm --version

# Check if port is in use
netstat -ano | findstr 3005
```

### Fix Common Issues

**PowerShell Execution Policy:**
```powershell
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Node.js PATH Issues:**
```powershell
# Check if Node.js is in PATH
$env:PATH -split ';' | Where-Object { $_ -like "*node*" }

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

**Port Conflicts:**
```powershell
# Find process using port 3005
netstat -ano | findstr 3005

# Kill process by PID
taskkill /PID [PID_NUMBER] /F

# Alternative: Stop all Node.js processes
taskkill /IM node.exe /F
```

**Permission Errors:**
```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb runAs

# Fix npm permissions
npm config set cache "C:\Users\%USERNAME%\AppData\Roaming\npm-cache" --global
```

### Diagnostic Commands
```powershell
# System information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory

# Check available memory
Get-WmiObject -Class Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

## Advanced Commands

### Performance Monitoring
```powershell
# Monitor CPU usage during build
Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 5

# Monitor memory usage
Get-Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 5

# Check running processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### Network Commands
```powershell
# Test internet connection
Test-NetConnection -ComputerName nodejs.org -Port 443

# Check local server
Test-NetConnection -ComputerName localhost -Port 3005

# List all listening ports
netstat -an | findstr LISTENING
```

### File System Commands
```powershell
# Check project structure
Get-ChildItem -Recurse -Name | Where-Object {$_ -like "*.ps1"}

# Check file sizes
Get-ChildItem node_modules -Recurse | Measure-Object -Property Length -Sum

# Find large files
Get-ChildItem -Recurse | Where-Object {$_.Length -gt 10MB} | Select-Object Name, Length, FullName
```

## Environment Variables

### Setting Environment Variables
```powershell
# Set for current session
$env:NODE_ENV = "development"
$env:PORT = "3005"

# Set permanently for user
[Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")

# Check environment variable
$env:NODE_ENV
```

### Common Environment Variables
```powershell
$env:NODE_ENV                           # development/production
$env:PORT                              # Server port (default 3005)
$env:ANALYZE                           # Bundle analyzer flag
$env:PATH                              # System PATH
$env:USERPROFILE                       # User home directory
$env:TEMP                              # Temporary files directory
```

## Package Management

### NPM Cache Management
```powershell
npm cache verify                       # Verify cache
npm cache clean --force                # Clean cache
npm config get cache                   # Show cache location
```

### Dependency Management
```powershell
npm list                               # List installed packages
npm outdated                           # Check outdated packages
npm audit                              # Security audit
npm audit fix                          # Fix security issues
```

### Version Management
```powershell
npm version                            # Show versions
npm ls --depth=0                      # Top-level packages only
npm list --global --depth=0          # Global packages
```

## Shortcuts and Aliases

### Create PowerShell Aliases
Add to your PowerShell profile (`$PROFILE`):

```powershell
# Create aliases for common commands
New-Alias -Name hda-dev -Value "npm run dev"
New-Alias -Name hda-build -Value "npm run build"
New-Alias -Name hda-trouble -Value "./scripts/troubleshoot.ps1"

# Function shortcuts
function Start-Dashboard { npm run dev }
function Build-Dashboard { npm run build }
function Fix-Dashboard { ./scripts/troubleshoot.ps1 -Fix }
```

### Quick Commands
```powershell
# One-liners for common tasks
cd path\to\project; npm run dev                    # Navigate and start
./scripts/cleanup.ps1 -Cache; npm run build       # Clean cache and build  
./scripts/troubleshoot.ps1 -Fix; npm run dev      # Fix issues and start
```

## Help Commands

### Getting Help
```powershell
# Script help
./scripts/install.ps1 -Help
./scripts/dev.ps1 -Help
./scripts/build.ps1 -Help
./scripts/troubleshoot.ps1 -Help
./scripts/cleanup.ps1 -Help

# NPM help
npm help
npm help install
npm help scripts

# PowerShell help
Get-Help Get-Process
Get-Help about_Execution_Policies
```

### Documentation
```powershell
# Open documentation files
notepad README.md
notepad WINDOWS-SETUP.md
notepad POWERSHELL-COMMANDS.md

# List all documentation
Get-ChildItem *.md
```

---

## Quick Reference Card

**Most Common Commands:**
```powershell
./scripts/install.ps1               # Initial setup
npm run dev                        # Start development
./scripts/troubleshoot.ps1         # Fix problems
./scripts/cleanup.ps1 -Full        # Complete uninstall
```

**Emergency Commands:**
```powershell
taskkill /IM node.exe /F           # Stop all Node processes
./scripts/troubleshoot.ps1 -Fix    # Auto-fix all issues  
./scripts/cleanup.ps1 -Cache       # Clear caches
npm cache clean --force            # Clear npm cache
```

*Keep this file handy for quick reference while working with the Healthcare Analytics Dashboard on Windows!*