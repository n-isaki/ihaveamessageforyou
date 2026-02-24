# Trunk-based Development Guidelines

## 🎯 Unsere Strategie

Wir verwenden **dev** als Haupt-Branch (Trunk) und **main** für Production-Ready Code.

## 🔄 Workflow

### 1. Feature Development
```bash
# 1. Pull latest dev branch
git checkout dev
git pull origin dev

# 2. Create short-lived feature branch (max 1-2 hours)
git checkout -b feature/audio-player-improvements

# 3. Make small, focused changes
# ... work on feature ...

# 4. Commit frequently with descriptive messages
git add .
git commit -m "feat: improve audio player controls"

# 5. Push and create PR immediately
git push origin feature/audio-player-improvements
# Create PR against dev branch

# 6. Get review, merge to dev
# Delete feature branch after merge
```

### 2. Feature Toggle Usage
```javascript
import { FeatureFlag } from '@/utils/featureFlags';

// In your component
<FeatureFlag feature="ADVANCED_AUDIO_PLAYER">
  <NewAudioPlayer />
</FeatureFlag>
```

### 3. Environment Variables
```bash
# .env.local
REACT_APP_NEW_NOOR_VIEWER=true
REACT_APP_ADVANCED_AUDIO_PLAYER=false
```

## 📏 Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix  
- `refactor:` Code refactoring
- `style:` Code style changes
- `test:` Adding tests
- `docs:` Documentation

## 🚀 Deployment Strategy

1. **dev** → Staging (automatisch bei jedem Push)
2. **main** → Production (manuell oder nach Release)

## ⚡ Best Practices

### ✅ Do's
- **Kleine Commits** (1-2 Files max)
- **Häufig mergen** (mindestens 2x täglich)
- **Feature Toggles** für unfertige Features
- **Automatische Tests** für jeden Commit
- **Code Reviews** vor Merge

### ❌ Don'ts
- **Keine langen Branches** (> 1 Tag)
- **Keine großen Änderungen** auf einmal
- **Kein direkter Push** auf main
- **Keine broken builds** auf trunk

## 🛠 Tools & Setup

### Pre-commit Hook (optional)
```bash
# .husky/pre-commit
npm run lint
npm run test -- --watchAll=false
```

### Branch Protection Rules
```yaml
# GitHub Settings für dev branch
- Require pull request reviews
- Require status checks to pass
- Require up-to-date branches before merging
```

## 📊 Monitoring

- **Build Status**: Immer grün auf trunk
- **Test Coverage**: Mindestens 80%
- **Deployment Frequency**: Mehrmals täglich
- **Lead Time**: < 1 Stunde für kleine Features

## 🔄 Rollback Strategy

Bei Problemen auf Production:
```bash
# Schneller Rollback auf letzten stable commit
git revert <commit-hash>
git push origin main
```

## 📚 Beispiele

### Beispiel 1: Neue Audio Player Funktion
```bash
# 1. Feature Flag aktivieren
echo "REACT_APP_ADVANCED_AUDIO_PLAYER=true" >> .env.local

# 2. Feature entwickeln mit Toggle
git checkout -b feature/advanced-audio
# ... implement with FeatureFlag wrapper ...

# 3. Testen und mergen
git commit -m "feat: add advanced audio player behind flag"
git push origin feature/advanced-audio
# Create PR, merge to dev

# 4. Production rollout
echo "REACT_APP_ADVANCED_AUDIO_PLAYER=true" >> .env.production
git commit -m "feat: enable advanced audio player in production"
git push origin main
```

### Beispiel 2: Bug Fix
```bash
# Direkt auf dev für kritische Bugs
git checkout dev
git pull origin dev
# ... fix bug ...
git commit -m "fix: resolve audio playback issue"
git push origin dev
# Optional: Cherry-pick zu main für hotfix
```
