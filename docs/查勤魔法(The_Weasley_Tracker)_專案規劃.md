# 查勤魔法 The Weasley Tracker - MVP 專案規劃
※ 靈感來源於哈利波特 - 衛斯理鍾 (Weasley Clock)

## 專案概述

### 需求簡述
想法起源於工作日常所遇到的窘境，例如有時候難以掌握所有同仁的動態，在代替同仁接聽電話時，有時候會難以確認同仁狀態導致無法適當的回覆電話。
希望能透過應用程式獲取公司同仁的行動狀態，並結合 AI + MCP Tools 功能協助確認同仁當前狀態並回覆。

### MVP 專案目標
1. **概念驗證**：使用 Electron 開發桌面應用程式，驗證 AI + MCP Tools 的核心概念可行性
2. **單機模式**：使用 electron-store 儲存狀態，不需要線上同步，所有資料使用 Mock Data
3. **模擬多個使用者**：建立 Mock 使用者資料並實作簡易的登入/登出系統
4. **AI 調用 MCP tools**：實現 AI 理解使用者訊息，調用對應方法進行查詢、修改，並回覆使用者
5. **批量查詢功能**：支援自然語言詢問如「目前有誰在會議中？」、「小王、小李、小陳現在的狀態是？」

## 🎯 核心功能設計

### 1. 簡易登入系統
- 使用 Mock Data 模擬多個同仁的資料
- 簡單的登入/登出切換，模擬不同同仁操作應用程式

### 2. 基本狀態管理
- **6 種狀態**：
  - `on_duty`: 崗位上
  - `off_duty`: 已下班
  - `on_leave`: 請假
  - `wfh`: 遠端上班
  - `out`: 外出中
  - `meeting`: 會議中
- 在應用程式介面上，每位同仁只會顯示一種狀態

### 3. 出勤紀錄與行事曆紀錄整合
- **出勤紀錄**：
  - 讀取出勤紀錄表 (AttendanceRecords)
  - 包含簽到時間、簽退時間、工作地點類型 (office 或 wfh)
  - 根據簽到/簽退時間更新狀態
  - 支援遠端上班 (WFH) 狀態
- **行事曆紀錄**：
  - 讀取行事曆紀錄表 (CalendarEvents)
  - 包含會議時間、狀態 (`scheduled`, `ongoing`, `completed`, `canceled`)
  - 判斷會議時間，更新成員進入或移除「會議中」狀態

### 4. AI 對話功能
- **查詢功能**：「小王現在在做什麼？」、「這位同仁今天遠端上班」
- **批量查詢**：「誰現在在會議中？」、「小王和小李現在在做什麼？」
- **狀態更新**：「我要外出，下午3點回來」，AI 會即時更新狀態為「外出中」

### 5. 狀態過期與恢復機制
- 所有狀態都具有過期時間
- 過期後會依照恢復邏輯更新狀態

### 6. 自定義狀態標籤管理
- **功能說明**：允許使用者建立個人化狀態標籤，提供比基本6種狀態更細致的狀態描述
- **核心功能**：
  - **新增自定義標籤**：使用者可建立專屬的狀態標籤
  - **編輯現有標籤**：修改已建立的標籤名稱
  - **刪除標籤**：移除不需要的標籤
  - **選擇當前標籤**：從自定義標籤清單中選擇目前狀態
  - **清除標籤**：移除當前選擇的標籤
- **存取位置**：透過右上角使用者選單進行管理
- **資料儲存**：每位使用者個別管理自己的標籤清單
- **與核心狀態關係**：自定義標籤獨立於基本6種狀態類型，不影響狀態優先級解析，純粹作為使用者個人化標記功能

## 📊 資料結構設計

### 使用者資料表 (唯讀)
```typescript
interface MockUser {
  id: string
  name: string
  department: string
  tag?: string              // 目前選擇的自定義標籤
  customTags?: string[]     // 使用者自定義標籤清單
  workSchedule: {
    startTime: string // Default "08:30"
    endTime: string // Default "17:30"
  }
}
```

### 出勤紀錄表 (Mock Data - 唯獨)
```typescript
interface AttendanceRecord {
  id: string
  userId: string
  checkIn?: Date // 簽到時間（office 和 wfh 都需要）
  checkOut?: Date // 簽退時間（office 和 wfh 都需要）
  workType: 'office' | 'wfh' // 工作地點類型
  date: string // YYYY-MM-DD
  status: 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' // 當前狀態
  startTime: Date // 預定開始時間
  endTime: Date // 預定結束時間
}
```

### 行事曆紀錄表 (Mocl Data - 唯獨)
```typescript
interface CalendarEvent {
  id: string
  userId: string
  title: string
  startTime: Date
  endTime: Date
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled'
  eventStatus: 'meeting'
}
```

### 主狀態表 (可讀寫)
```typescript
type StatusType = 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' | 'out' | 'meeting'

interface UserStatus {
  userId: string
  name: string

  // 當前有效狀態（經過優先級計算後的結果）
  currentStatus: StatusType
  statusDetail?: string
  lastUpdated: Date
  expiresAt: Date

  // 所有時間段記錄（按優先級和時間排序）
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  status: StatusType
  statusDetail?: string
  source: 'attendance' | 'calendar' | 'ai_modified'
  priority: number // 3=AI修改, 2=出勤, 1=行事曆
  createdAt: Date
  expiresAt: Date
}
```

## 🔄 業務邏輯設計

### 狀態過期與恢復機制
#### 過期時間設計原則
所有狀態都具有過期時間機制，確保狀態能在適當時機自動更新：

1. **工作日狀態過期時間**：預設以當日下班時間為過期時間
   - `on_duty`、`wfh`、`meeting`、`out` 等工作相關狀態
   - 過期後自動轉換為 `off_duty` 狀態

2. **非工作日狀態過期時間**：
   - `off_duty`：預設過期時間為隔日上班時間
   - `on_leave`：依據請假期間設定過期時間

3. **特殊狀態過期時間**：
   - `meeting`：以會議結束時間為過期時間
   - `out`：依據使用者回報的預計返回時間設定

#### 狀態恢復邏輯
1. **時間邊界檢查 (最高優先級)**：
  - **非工作日**：直接設定為 `off_duty`
  - **工作日且當前時間 < 08:30**：設定為 `off_duty`
  - **工作日且當前時間 > 17:30**：設定為 `off_duty`
  - **工作日且 08:30 ≤ 當前時間 < 17:30**：進入下一步檢查

2. **高優先級未過期狀態檢查**：
  - 檢查是否存在**未過期**且**優先級更高**的 TimeSlot
  - 如果存在，使用該 TimeSlot 的狀態
  - 如果不存在，進入下一步檢查

3. **當前時段活動檢查**：
  - 檢查當前時間是否有請假、會議、外出 (`on_leave`, `meeting`, `out`)
  - 如果存在，使用對應狀態
  - 如果不存在，進入下一步檢查

4. **出勤記錄狀態檢查**：
  - 檢查當日出勤記錄的 `checkIn` 和 `checkOut` 狀態：
    - 如果有 `checkIn` 且無 `checkOut`：
      - `workType` 為 `wfh`：恢復為 `wfh`
      - `workType` 為 `office`：恢復為 `on_duty`
    - 如果有 `checkOut`：設定為 `off_duty`
    - 如果無 `checkIn`：設定為 `off_duty`

5. **預設狀態 (最低優先級)**：
  - 工作時間內且無其他資訊：設定為 `on_duty`
  - 其他情況：設定為 `off_duty`

## 🛠 技術架構設計

### 資料同步策略
1. **應用程式啟動同步**
- 啟動時自動同步當日出勤紀錄和行事曆紀錄
- 檢查所有同仁的狀態過期情況並執行恢復機制

2. **手動同步**
- 使用者可在應用程式介面觸發手動同步
- 重新讀取當日出勤紀錄和行事曆紀錄
- 更新主狀態表中的原始資料 (優先級較低的資料)

3. **AI 即時更新**
- 使用者透過自然語言要求 AI 更新狀態時立即生效
- AI 會調用 MCP tools 更新主狀態表，在主狀態表中建立高優先級的修改紀錄
- 採用**後進先出原則**處理狀態衝突

### 狀態更新優先級與衝突處理
#### 後進先出原則
所有狀態更新都遵循**後進先出原則**：

1. **整段時段覆蓋**：
  - 新的狀態更新會完全取代衝突時段的舊狀態
  - 例如：原本 09:00-12:00 請假，使用者 10:00 要求改為崗位上
  - 結果：AI 協助取消 09:00-12:00 請假狀態，建立新的崗位上狀態，並詢問使用者是否要建立 09:00-10:00 請假狀態加入當日的歷史狀態紀錄。

2. **未來狀態預約**：
  - 支援使用者預約未來時段的狀態
  - 衝突時新狀態完全覆蓋舊狀態的重疊時段
  - 例如：原本 14:00-17:30 外出，使用者要求 15:00-17:30 改為會議
  - 結果：AI 協助取消 14:00-17:30 外出狀態，建立新的 15:00-17:30 會議狀態，並詢問使用者是否要建立 14:00-15:00 外出狀態加入當日的歷史狀態紀錄。

#### 資料優先級
主狀態表同時記錄多種資料類型，按優先級顯示：

1. **AI 修改資料** (最高優先級) - `ai_modified`
  - 使用者透過 AI 要求修改的狀態
  - 防止同步時被原始資料覆蓋

2. **出勤紀錄資料** (中等優先級) - `attendance`
  - 來自出勤系統的原始資料 (AttendanceRecords)

3. **行事曆資料** (最低優先級) - `calendar`
  - 來自行事曆系統的原始資料 (CalendarEvents)

**顯示邏輯**：應用程式優先顯示高優先級的狀態資料，確保使用者要求 AI 修改的狀態不會被系統同步覆蓋。

### 使用技術
- **前端框架**：Electron (electron-vite v4.0.0) + Vue3 + TailwindCSS (v4)
- **前端路由**：Vue Router v4
- **資料儲存**：electron-store
- **開發語言**：TypeScript + Node.js
- **AI 整合**：@modelcontextprotocol/sdk
- **建構工具**：Vite
