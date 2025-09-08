# Windows 構建與部署指南

## 環境需求

### WSL Ubuntu 24.04 環境
- Node.js 22.17.1+
- npm 10.0+
- Wine 10.0+ (已自動安裝)
- 足夠的磁碟空間 (至少 2GB)

## 構建流程

### 1. 環境準備

```bash
# 確認當前目錄
cd /data/the-weasley-tracker

# 安裝相依套件 (如果尚未安裝)
npm install
```

### 2. 類型檢查

```bash
# 執行 TypeScript 類型檢查
npm run typecheck
```

### 3. 執行 Windows 構建

```bash
# 構建 Windows 版本 (同時支援 x64 和 ARM64)
npm run build:win
```

**構建過程說明：**
- 自動執行類型檢查 (`npm run typecheck`)
- 編譯 Electron 主程序、預載腳本和渲染程序
- 下載 ARM64 版本的 Electron (約 123MB)
- 生成 x64 和 ARM64 兩個版本的可執行檔
- 建立 NSIS 安裝程式

### 4. 驗證構建結果

```bash
# 檢查構建產物
ls -la dist/

# 確認檔案類型
file dist/the-weasley-tracker-1.0.0-setup.exe
```

**預期輸出：**
- `the-weasley-tracker-1.0.0-setup.exe` (約 183MB)
- `the-weasley-tracker-1.0.0-setup.exe.blockmap`
- `latest.yml`
- `win-unpacked/` 和 `win-arm64-unpacked/` 目錄

## 部署流程

### 檔案交付

#### 方法 1: Windows 檔案總管直接存取 (推薦)
1. 在 Windows 檔案總管位址列輸入：
   ```
   \\wsl$\Ubuntu-24.04\data\the-weasley-tracker\dist\
   ```
2. 複製 `the-weasley-tracker-1.0.0-setup.exe` 到目標位置

#### 方法 2: 命令列複製
```bash
# 複製到 Windows 桌面 (需要確認用戶名)
cp dist/the-weasley-tracker-1.0.0-setup.exe /mnt/c/Users/[用戶名]/Desktop/

# 複製到共享目錄
cp dist/the-weasley-tracker-1.0.0-setup.exe /mnt/c/temp/
```

### Windows 安裝

1. **執行安裝程式**
   - 雙擊 `the-weasley-tracker-1.0.0-setup.exe`

2. **安裝選項**
   - 選擇安裝目錄 (預設：`C:\Users\[用戶名]\AppData\Local\Programs\The Weasley Tracker`)
   - 確認建立桌面捷徑
   - 確認建立開始選單項目

3. **完成安裝**
   - 安裝完成後會自動建立捷徑
   - 可從桌面或開始選單啟動應用程式

## 構建配置說明

### 優化後的配置特色

```yaml
win:
  executableName: the-weasley-tracker
  target:
    - target: nsis
      arch: [x64, arm64]          # 同時支援 x64 和 ARM64
  publisherName: The Weasley Tracker

nsis:
  oneClick: false                 # 允許用戶選擇安裝選項
  allowToChangeInstallationDirectory: true  # 允許選擇安裝目錄
  createDesktopShortcut: always   # 總是建立桌面捷徑
  createStartMenuShortcut: true   # 建立開始選單捷徑
```

### WSL 環境特殊處理

應用程式內建 WSL 檢測邏輯：
```typescript
function shouldDisableGPU() {
  // 自動檢測 WSL 環境並禁用 GPU 加速
  if (process.platform === 'linux') {
    const version = fs.readFileSync('/proc/version', 'utf8')
    if (version.toLowerCase().includes('microsoft') || 
        version.toLowerCase().includes('wsl')) {
      return true
    }
  }
  return false
}
```

## 故障排除

### 常見問題

**1. 構建失敗：Wine 相關錯誤**
```bash
# 檢查 Wine 版本
wine --version

# 重新初始化 Wine (如果需要)
winecfg
```

**2. 類型檢查失敗**
```bash
# 單獨執行類型檢查查看詳細錯誤
npm run typecheck:node
npm run typecheck:web
```

**3. 檔案權限問題**
```bash
# 修復檔案權限
sudo chown -R $USER:$USER dist/
chmod 755 dist/*.exe
```

**4. 磁碟空間不足**
```bash
# 清理舊的構建檔案
rm -rf dist/
rm -rf out/

# 檢查磁碟使用量
df -h
```

### 效能最佳化

**啟用並行構建：**
```bash
export ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
export ELECTRON_CACHE="$HOME/.cache/electron"
export ELECTRON_BUILDER_CACHE="$HOME/.cache/electron-builder"
```

## 版本管理

### 更新版本號
1. 修改 `package.json` 中的 `version` 欄位
2. 重新執行 `npm run build:win`
3. 新的安裝程式會包含新版本號

### 自動更新
應用程式已配置 `electron-updater`，支援自動更新功能。更新伺服器配置在 `electron-builder.yml` 的 `publish` 區段。

## 開發命令參考

```bash
# 開發模式
npm run dev

# 類型檢查
npm run typecheck

# 程式碼檢查
npm run lint

# 修復程式碼格式
npm run lint:fix

# 構建所有平台
npm run build

# 僅構建 Windows
npm run build:win

# 預覽構建結果
npm start
```