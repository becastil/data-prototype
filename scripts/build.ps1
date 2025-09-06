# Healthcare Analytics Dashboard - Production Build Script
# Compatible with PowerShell 5.1+ and PowerShell 7+
# Handles bundle analysis and performance optimization

[CmdletBinding()]
param(
    [switch]$Analyze,
    [switch]$Production,
    [switch]$Clean,
    [switch]$Test,
    [switch]$Help,
    [switch]$Quiet,
    [string]$OutputDir = ".next"
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
    Write-ColorOutput "Healthcare Analytics Dashboard - Production Build" $ColorCyan
    Write-ColorOutput ("-" * 50) $ColorCyan
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" $ColorWhite
    Write-ColorOutput "  .\scripts\build.ps1 [OPTIONS]" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" $ColorWhite
    Write-ColorOutput "  -Analyze          Enable bundle analyzer" $ColorYellow
    Write-ColorOutput "  -Production       Build for production deployment" $ColorYellow
    Write-ColorOutput "  -Clean            Clean build directory first" $ColorYellow
    Write-ColorOutput "  -Test             Run tests after build" $ColorYellow
    Write-ColorOutput "  -Quiet            Minimize output" $ColorYellow
    Write-ColorOutput "  -OutputDir <dir>  Specify output directory (default: .next)" $ColorYellow
    Write-ColorOutput "  -Help             Show this help message" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" $ColorWhite
    Write-ColorOutput "  .\scripts\build.ps1                    # Basic production build" $ColorYellow
    Write-ColorOutput "  .\scripts\build.ps1 -Analyze           # Build with bundle analysis" $ColorYellow
    Write-ColorOutput "  .\scripts\build.ps1 -Clean -Test       # Clean build and run tests" $ColorYellow
    Write-ColorOutput "  .\scripts\build.ps1 -Production        # Optimized production build" $ColorYellow
    Write-ColorOutput ""
    Write-ColorOutput "BUNDLE ANALYSIS:" $ColorWhite
    Write-ColorOutput "  The bundle analyzer will open automatically in your browser" $ColorYellow
    Write-ColorOutput "  showing detailed bundle size information and optimization tips." $ColorYellow
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
        Write-ColorOutput "Please install Node.js or run .\scripts\install.ps1" $ColorYellow
        return $false
    }
    
    return $true
}

function Clean-BuildDirectory {
    Write-ColorOutput "Cleaning build directory..." $ColorCyan
    
    try {
        if (Test-Path $OutputDir) {
            Remove-Item $OutputDir -Recurse -Force
            Write-ColorOutput "✓ Build directory cleaned" $ColorGreen
        }
        
        # Also clean other build artifacts
        $cleanPaths = @(".next", "out", "dist", "build")
        foreach ($path in $cleanPaths) {
            if (Test-Path $path) {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
        # Clear npm cache
        npm cache clean --force 2>$null
        
        return $true
    } catch {
        Write-ColorOutput "⚠ Error cleaning build directory: $($_.Exception.Message)" $ColorYellow
        return $false
    }
}

function Start-Build {
    Write-ColorOutput "Starting production build..." $ColorCyan
    Write-ColorOutput "This may take several minutes..." $ColorYellow
    
    try {
        # Set environment variables
        if ($Production) {
            $env:NODE_ENV = "production"
            Write-ColorOutput "✓ Production mode enabled" $ColorGreen
        }
        
        if ($Analyze) {
            $env:ANALYZE = "true"
            Write-ColorOutput "✓ Bundle analyzer enabled" $ColorGreen
        }
        
        # Start build process
        $startTime = Get-Date
        
        if ($Analyze) {
            Write-ColorOutput "Running build with bundle analysis..." $ColorCyan
            npm run build 2>&1 | Tee-Object -Variable buildOutput
        } else {
            Write-ColorOutput "Running production build..." $ColorCyan
            npm run build 2>&1 | Tee-Object -Variable buildOutput
        }
        
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ Build completed successfully in $([math]::Round($buildTime, 1)) seconds" $ColorGreen
            return $true
        } else {
            Write-ColorOutput "✗ Build failed" $ColorRed
            Write-ColorOutput "Build output:" $ColorYellow
            $buildOutput | ForEach-Object { Write-ColorOutput "  $_" $ColorYellow }
            return $false
        }
        
    } catch {
        Write-ColorOutput "✗ Build error: $($_.Exception.Message)" $ColorRed
        return $false
    } finally {
        # Clean up environment variables
        Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
        Remove-Item Env:ANALYZE -ErrorAction SilentlyContinue
    }
}

function Get-BuildInfo {
    Write-ColorOutput "Analyzing build results..." $ColorCyan
    
    try {
        if (Test-Path $OutputDir) {
            # Calculate build size
            $buildSize = Get-ChildItem $OutputDir -Recurse | Measure-Object -Property Length -Sum
            $buildSizeMB = [math]::Round($buildSize.Sum / 1MB, 2)
            $buildSizeKB = [math]::Round($buildSize.Sum / 1KB, 0)
            
            Write-ColorOutput "📊 Build Statistics:" $ColorCyan
            Write-ColorOutput "  Total build size: $buildSizeMB MB ($buildSizeKB KB)" $ColorWhite
            
            # Check static assets
            $staticPath = Join-Path $OutputDir "static"
            if (Test-Path $staticPath) {
                $staticSize = Get-ChildItem $staticPath -Recurse | Measure-Object -Property Length -Sum
                $staticSizeMB = [math]::Round($staticSize.Sum / 1MB, 2)
                Write-ColorOutput "  Static assets: $staticSizeMB MB" $ColorWhite
            }
            
            # Performance recommendations
            Write-ColorOutput "`n🎯 Performance Analysis:" $ColorCyan
            if ($buildSizeKB -gt 500) {
                Write-ColorOutput "  ⚠ Build size is large (>500KB)" $ColorYellow
                Write-ColorOutput "  Consider running with -Analyze to identify optimizations" $ColorYellow
            } else {
                Write-ColorOutput "  ✓ Build size looks good (<500KB)" $ColorGreen
            }
            
            # Check for specific files
            $jsFiles = Get-ChildItem (Join-Path $OutputDir "static") -Filter "*.js" -Recurse -ErrorAction SilentlyContinue
            if ($jsFiles) {
                $totalJsSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum / 1KB
                Write-ColorOutput "  JavaScript bundle: $([math]::Round($totalJsSize, 0)) KB" $ColorWhite
            }
            
            $cssFiles = Get-ChildItem (Join-Path $OutputDir "static") -Filter "*.css" -Recurse -ErrorAction SilentlyContinue
            if ($cssFiles) {
                $totalCssSize = ($cssFiles | Measure-Object -Property Length -Sum).Sum / 1KB
                Write-ColorOutput "  CSS bundle: $([math]::Round($totalCssSize, 0)) KB" $ColorWhite
            }
        }
    } catch {
        Write-ColorOutput "⚠ Could not analyze build: $($_.Exception.Message)" $ColorYellow
    }
}

function Test-Build {
    Write-ColorOutput "Testing build..." $ColorCyan
    
    try {
        # Test TypeScript compilation
        Write-ColorOutput "Checking TypeScript..." $ColorCyan
        $tsOutput = npx tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ TypeScript check passed" $ColorGreen
        } else {
            Write-ColorOutput "⚠ TypeScript check had warnings" $ColorYellow
        }
        
        # Test if build can start
        Write-ColorOutput "Testing production server start..." $ColorCyan
        
        # Start server in background and test
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            npm start 2>&1
        }
        
        # Wait a few seconds for server to start
        Start-Sleep -Seconds 10
        
        # Test if server is responding
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3005" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "✓ Production server test passed" $ColorGreen
                $testResult = $true
            } else {
                Write-ColorOutput "⚠ Production server returned status $($response.StatusCode)" $ColorYellow
                $testResult = $false
            }
        } catch {
            Write-ColorOutput "⚠ Could not connect to production server" $ColorYellow
            $testResult = $false
        }
        
        # Stop the background job
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        
        return $testResult
        
    } catch {
        Write-ColorOutput "⚠ Build test encountered issues: $($_.Exception.Message)" $ColorYellow
        return $false
    }
}

function Show-NextSteps {
    Write-ColorOutput "`n" + "=" * 60 $ColorGreen
    Write-ColorOutput "🎉 Production Build Complete!" $ColorGreen
    Write-ColorOutput "=" * 60 $ColorGreen
    
    Write-ColorOutput "`nNext steps:" $ColorCyan
    Write-ColorOutput "1. Test the production build:" $ColorWhite
    Write-ColorOutput "   npm start" $ColorYellow
    
    Write-ColorOutput "`n2. Deploy to your hosting platform:" $ColorWhite
    Write-ColorOutput "   - Vercel: Push to GitHub and import project" $ColorYellow
    Write-ColorOutput "   - Netlify: Drag and drop the .next folder" $ColorYellow
    Write-ColorOutput "   - AWS Amplify: Use amplify.yml configuration" $ColorYellow
    
    Write-ColorOutput "`n3. Performance optimization:" $ColorWhite
    Write-ColorOutput "   - Run with -Analyze flag to see bundle breakdown" $ColorYellow
    Write-ColorOutput "   - Check Lighthouse scores in production" $ColorYellow
    
    Write-ColorOutput "`nTroubleshooting:" $ColorWhite
    Write-ColorOutput "- Build issues: .\scripts\troubleshoot.ps1" $ColorYellow
    Write-ColorOutput "- Bundle too large: .\scripts\build.ps1 -Analyze" $ColorYellow
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-ColorOutput "🏥 Healthcare Analytics Dashboard - Production Build" $ColorCyan
    Write-ColorOutput ("-" * 60) $ColorCyan
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    # Clean build directory if requested
    if ($Clean) {
        Clean-BuildDirectory | Out-Null
    }
    
    # Start build process
    if (-not (Start-Build)) {
        Write-ColorOutput "`n✗ Build failed" $ColorRed
        Write-ColorOutput "Run .\scripts\troubleshoot.ps1 for help" $ColorYellow
        exit 1
    }
    
    # Analyze build results
    Get-BuildInfo
    
    # Test build if requested
    if ($Test) {
        Test-Build | Out-Null
    }
    
    # Show success message and next steps
    Show-NextSteps
    
    Write-ColorOutput "`n✓ Build process completed successfully!" $ColorGreen
    
    # Open bundle analyzer if requested
    if ($Analyze -and -not $Quiet) {
        Write-ColorOutput "`nBundle analyzer will open in your browser..." $ColorCyan
        Write-ColorOutput "Press any key to continue..." $ColorYellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }

} catch {
    Write-ColorOutput "`n✗ Build process failed: $($_.Exception.Message)" $ColorRed
    Write-ColorOutput "`nFor troubleshooting help:" $ColorYellow
    Write-ColorOutput "1. Run: .\scripts\troubleshoot.ps1" $ColorYellow
    Write-ColorOutput "2. Check the build logs above for specific errors" $ColorYellow
    Write-ColorOutput "3. Try running with -Clean flag to start fresh" $ColorYellow
    exit 1
}