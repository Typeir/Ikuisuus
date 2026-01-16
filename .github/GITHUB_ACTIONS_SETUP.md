# GitHub Actions CI/CD Setup Guide

This guide walks you through setting up the CI/CD pipeline for automated testing, coverage reporting, and deployment.

## 📋 What's Configured

### 1. Continuous Integration (`.github/workflows/ci.yml`)
- Runs on every push/PR to `main` and `develop` branches
- Executes pre-init scripts (asset compression, metadata generation)
- Runs full test suite with coverage
- Uploads coverage to Codecov
- Builds Next.js application
- Runs linter

### 2. Production Deployment (`.github/workflows/deploy.yml`)
- Triggers on push to `main` or manual dispatch
- Runs tests before deployment
- Deploys to Vercel on success

### 3. Build Script Updates
- **`npm run build`** - Now includes test execution (fails if tests fail)
- **`npm run build:skip-tests`** - Skips tests (for CI where tests already ran)

## 🔧 Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**
4. Click **Save**

### Step 2: Set Up Codecov (Optional but Recommended)

Codecov provides coverage badges and detailed coverage reports.

1. **Sign up at [codecov.io](https://codecov.io)** with your GitHub account
2. **Add your repository** to Codecov
3. **Get your upload token**:
   - Go to your repository on Codecov
   - Navigate to **Settings** → **General**
   - Copy the "Repository Upload Token"
4. **Add token to GitHub Secrets**:
   - Go to your GitHub repository
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: Paste your Codecov token
   - Click **Add secret**

### Step 3: Set Up Vercel Deployment (Optional)

Only needed if using the deploy workflow.

1. **Get Vercel credentials**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   
   # Get required tokens
   vercel --prod
   ```

2. **Add secrets to GitHub**:
   - `VERCEL_TOKEN` - From Vercel dashboard → Settings → Tokens
   - `VERCEL_ORG_ID` - Found in `.vercel/project.json` after linking
   - `VERCEL_PROJECT_ID` - Found in `.vercel/project.json` after linking

### Step 4: Update README Badges

Replace `YOUR_USERNAME` in `README.md` with your actual GitHub username:

```markdown
[![CI Pipeline](https://github.com/YOUR_USERNAME/Ikuisuus/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/Ikuisuus/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/Ikuisuus/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/Ikuisuus)
```

Example:
```markdown
[![CI Pipeline](https://github.com/johndoe/Ikuisuus/actions/workflows/ci.yml/badge.svg)](https://github.com/johndoe/Ikuisuus/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/johndoe/Ikuisuus/branch/main/graph/badge.svg)](https://codecov.io/gh/johndoe/Ikuisuus)
```

## 🧪 Testing the Pipeline

### Local Testing

Test the full build pipeline locally before pushing:

```bash
# Run pre-init scripts
npm run pre-init

# Run tests with coverage
npm run test:coverage

# Build (includes tests)
npm run build
```

### First Push

1. **Commit the new workflows**:
   ```bash
   git add .github/workflows/ package.json vitest.config.ts README.md
   git commit -m "feat: add CI/CD pipeline with testing and coverage"
   git push
   ```

2. **Monitor the workflow**:
   - Go to **Actions** tab in your GitHub repository
   - Watch the "CI Pipeline" workflow run
   - Check for any errors

## 📊 Understanding the Pipeline

### CI Pipeline Flow

```
Push/PR to main/develop
        ↓
    Checkout Code
        ↓
   Setup Node.js
        ↓
 Install Dependencies
        ↓
  Run Pre-Init Scripts
  (compress assets, generate metadata, etc.)
        ↓
   Run Tests with Coverage
        ↓
  Upload Coverage to Codecov
        ↓
    Build Next.js App
        ↓
  Upload Build Artifacts
```

### Deploy Pipeline Flow

```
Push to main (or manual trigger)
        ↓
    Checkout Code
        ↓
   Setup Node.js
        ↓
 Install Dependencies
        ↓
  Run Pre-Init Scripts
        ↓
      Run Tests
        ↓
   Deploy to Vercel
```

## 🚨 Troubleshooting

### Tests Fail in CI but Pass Locally

**Cause**: Missing files from pre-init scripts

**Solution**: Ensure `.gitignore` is correct and pre-init runs in CI

### Coverage Upload Fails

**Cause**: Missing or incorrect `CODECOV_TOKEN`

**Solution**: 
1. Check token exists in GitHub Secrets
2. Verify token is valid in Codecov
3. Check Codecov status page for outages

### Deployment Fails

**Cause**: Missing Vercel credentials or build errors

**Solution**:
1. Verify all Vercel secrets are set correctly
2. Check Vercel dashboard for build logs
3. Test build locally: `npm run build`

### Build Takes Too Long

**Optimization Options**:
1. **Cache node_modules**: Already configured in workflows
2. **Run tests separately**: Tests run in parallel with build in CI
3. **Skip tests on second build**: Use `build:skip-tests` in deploy workflow

## 🎯 Coverage Goals

Current thresholds (configured in `vitest.config.ts`):
- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

To adjust:
```typescript
// vitest.config.ts
coverage: {
  statements: 80,  // Increase as you add tests
  branches: 70,
  functions: 80,
  lines: 80,
}
```

## 📈 Monitoring

### GitHub Actions
- View workflow runs: Repository → **Actions** tab
- Download artifacts: Click on workflow run → **Artifacts** section

### Codecov Dashboard
- Coverage trends over time
- File-level coverage breakdown
- Pull request coverage diffs
- Coverage sunburst charts

### Badges
Once set up, badges show real-time status:
- **CI Badge**: Green = all tests passing
- **Coverage Badge**: Shows current coverage percentage
- **Tests Badge**: Shows number of passing tests

## 🔒 Security Notes

1. **Never commit tokens** - Always use GitHub Secrets
2. **Limit token permissions** - Use minimal scopes
3. **Rotate tokens regularly** - Update secrets periodically
4. **Review workflow logs** - Check for exposed secrets

## ✅ Verification Checklist

- [ ] GitHub Actions enabled
- [ ] Codecov token added (if using)
- [ ] Vercel tokens added (if deploying)
- [ ] README badges updated with username
- [ ] First workflow run successful
- [ ] Coverage report uploaded
- [ ] Build artifacts created
- [ ] Deployment successful (if configured)

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)

---

**Questions?** Check the [Testing Documentation](./.github/docs/) or open an issue.
