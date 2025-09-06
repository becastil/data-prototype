# Getting Started - Visual Guide

Simple visual walkthrough to get you up and running quickly.

## 🎯 What You'll Accomplish

By the end of this guide, you'll have:
- ✅ Healthcare Analytics Dashboard running on your computer
- ✅ Your CSV files converted into beautiful charts
- ✅ Working knowledge of all major features

**Time needed:** 5-10 minutes

---

## 📋 Before You Start

**What you need:**
- [ ] Windows 10 or newer computer
- [ ] Your healthcare CSV files (budget data, claims data)
- [ ] 10 minutes of time
- [ ] Internet connection (for setup only)

**What you don't need:**
- ❌ Programming knowledge
- ❌ Server or cloud accounts
- ❌ Expensive software
- ❌ Technical background

---

## 🚀 Method 1: Super Quick Install (Recommended)

### Step 1: Open PowerShell
1. Press `Windows Key + R`
2. Type `powershell` 
3. Press Enter
4. You should see a blue window

### Step 2: Run the Magic Command
Copy this entire line and paste it into PowerShell:
```powershell
irm https://raw.githubusercontent.com/your-repo/main/scripts/install.ps1 | iex
```

**What happens next:**
- ⏳ Downloads installer (30 seconds)
- ⏳ Installs Node.js if needed (2-3 minutes)  
- ⏳ Downloads all components (2-3 minutes)
- ✅ Tests everything works

### Step 3: Start the Dashboard
When installation finishes, type:
```powershell
npm run dev
```

### Step 4: Open Your Browser
Navigate to: **http://localhost:3005**

🎉 **You should see the dashboard!**

---

## 🛠️ Method 2: Manual Install (If Method 1 Doesn't Work)

### Step 1: Install Node.js
1. Go to **https://nodejs.org**
2. Click the green **"LTS"** button
3. Download and run the installer
4. Accept all default settings
5. **Restart your computer**

### Step 2: Download the Project
1. Go to the GitHub repository
2. Click green **"Code"** button
3. Select **"Download ZIP"**
4. Extract to your Desktop

### Step 3: Install and Run
1. Right-click in the project folder
2. Select **"Open in Terminal"** or **"Open PowerShell window here"**
3. Type these commands:
```powershell
npm install
npm run dev
```

### Step 4: Open Browser
Navigate to: **http://localhost:3005**

---

## 📊 Using Your New Dashboard

### Upload Your Data Files

**You'll see two upload areas:**

**📈 Left Panel: "Budget Data"**
- Upload your financial/budget CSV file
- Should contain monthly budgets, expenses, admin fees

**📋 Right Panel: "Claims Data"**
- Upload your claims/member CSV file
- Should contain individual claim records

**Just drag and drop your files or click to browse!**

### What You'll See

After uploading both files, you get **4 interactive charts:**

**1. 📊 Budget vs Expenses Trend**
- Colorful stacked bars showing spending categories
- Line showing budget targets
- Rolling 12-month view

**2. 🔵 Cost Distribution Scatter Plot**
- Each dot represents cost bands
- Interactive tooltips with details
- Medical vs prescription costs

**3. 📈 Enrollment Trends Line Chart**  
- Member enrollment over time
- Growth/decline statistics
- Employee count tracking

**4. 📋 Data Table**
- Sortable columns (click headers)
- Search and filter capabilities
- Complete data view

---

## ⌨️ Power User Features (Optional)

### Keyboard Shortcuts
- **Ctrl+K** - Open command menu (like Spotlight on Mac)
- **Ctrl+D** - Switch light/dark theme
- **Ctrl+E** - Export your data
- **F1** - Show all shortcuts

### Export Options
- **CSV Export** - Spreadsheet format
- **PDF Export** - Printable reports
- **Excel Export** - Multiple sheets

### Theme Options
- **Light mode** - Default clean white theme
- **Dark mode** - Easy on the eyes
- **High contrast** - Accessibility optimized

---

## 🆘 When Things Go Wrong

### "npm is not recognized" Error

**What it means:** Node.js isn't installed or found.

**Quick fix:**
1. Install Node.js from https://nodejs.org
2. Restart PowerShell
3. Try again

**Automated fix:**
```powershell
./scripts/troubleshoot.ps1 -Fix
```

### "Port already in use" Error

**What it means:** Another program is using port 3005.

**Quick fix:**
```powershell
./scripts/dev.ps1 -Force
```

**Manual fix:**
```powershell
netstat -ano | findstr 3005
taskkill /PID [number_from_output] /F
```

### "Access denied" or Permission Errors

**What it means:** Windows is blocking PowerShell scripts.

**Quick fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Dashboard Won't Load

**What to try:**
1. Check PowerShell window for error messages
2. Try different browser
3. Make sure server is running (see "Ready" message)
4. Try: `./scripts/troubleshoot.ps1 -Fix`

### Files Won't Upload

**What to check:**
1. File is actually CSV format
2. First row has column headers
3. No special characters in file name
4. File isn't too large (>100MB)

**Quick fix:**
1. Open file in Excel
2. "Save As" → CSV format
3. Try uploading again

---

## 📚 Where to Get Help

### Built-in Help
```powershell
./scripts/troubleshoot.ps1          # Automatic problem solver
./scripts/install.ps1 -Help         # Installation help
./scripts/dev.ps1 -Help            # Development server help
```

### Documentation Files
- **README.md** - Complete user manual
- **FAQ.md** - Common questions and answers
- **WINDOWS-SETUP.md** - Detailed Windows instructions
- **POWERSHELL-COMMANDS.md** - All command reference

### Online Help
- **GitHub Issues** - Report bugs, ask questions
- **Email Support** - Personal assistance
- **Community** - User discussions and tips

---

## 🎯 Success Checklist

You're all set when you can:
- [ ] Open PowerShell and run scripts without errors
- [ ] Start the dashboard with `npm run dev`
- [ ] See the dashboard at http://localhost:3005
- [ ] Upload CSV files and see charts
- [ ] Export your data in different formats
- [ ] Use keyboard shortcuts (try Ctrl+K)

## 🎉 What's Next?

**Now that you're set up:**

1. **Upload your real data files** and explore the results
2. **Try the export features** to create reports
3. **Experiment with themes** (Ctrl+D)
4. **Share with colleagues** - send them this guide!
5. **Bookmark useful commands** from POWERSHELL-COMMANDS.md

**Pro Tips:**
- Keep your original CSV files safe as backups
- Export your results regularly
- Use the troubleshooting script whenever something seems off
- The dashboard is completely local - your data never leaves your computer

---

## 🔄 Daily Workflow

**Starting work:**
1. Open PowerShell in project folder
2. Type: `npm run dev`
3. Open browser to http://localhost:3005
4. Upload today's data files

**Finishing work:**
1. Export any important charts/data
2. Press Ctrl+C in PowerShell to stop
3. Close browser tab

**Next time:**
1. Just repeat "Starting work" steps
2. No need to reinstall anything!

---

*Remember: If anything breaks, start with `./scripts/troubleshoot.ps1 -Fix` - it solves most problems automatically!*

## 📞 Emergency Help

**If nothing works:**
1. Run: `./scripts/cleanup.ps1 -Full`
2. Run: `./scripts/install.ps1`
3. Start over with fresh installation

**Still stuck?**
- Copy any error messages you see
- Note what you were trying to do
- Create a GitHub Issue or email for help
- Include your Windows version and browser type

**Most problems are solved in under 5 minutes with the troubleshooting script!**