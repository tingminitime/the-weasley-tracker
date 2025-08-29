---
title: 查勤魔法 The Weasley Tracker ( 介面互動流程 )
---
flowchart TD
    %% 應用程式啟動與路由
    Start([應用程式啟動]) --> RouteCheck{檢查登入狀態}
    RouteCheck --> |未登入| LoginPage["/login 登入頁面"]
    RouteCheck --> |已登入| HomePage["首頁<br/>自動導向 /chat"]
    
    %% 登入頁面
    LoginPage --> |使用者登入<br/>Mock Data| InitSync[初始化同步<br/>當日出勤 + 行事曆紀錄]
    InitSync --> HomePage
    
    %% 首頁自動導向
    HomePage --> |自動導向| ChatPage["/chat AI 對話頁面"]
    
    %% 路由導航
    ChatPage --> |導航| DashboardPage["/dashboard 狀態頁面"]
    DashboardPage --> |導航| ChatPage
    LoginPage --> |登出| LoginPage
    ChatPage --> |登出| LoginPage
    DashboardPage --> |登出| LoginPage

    %% /chat 頁面功能
    ChatPage --> AIChat[AI 對話介面]
    AIChat --> |使用者輸入| AIProcessing[AI 理解與處理]
    AIProcessing --> QueryType{查詢類型}

    %% 查詢功能分支
    QueryType --> |狀態查詢| StatusQuery[查詢同仁狀態<br/>單人或多人批量查詢]
    QueryType --> |狀態更新| StatusUpdate[更新狀態要求<br/>調用 MCP Tools]

    %% 狀態查詢處理
    StatusQuery --> MCPQueryTools[MCP Tools 調用<br/>查詢方法]
    MCPQueryTools --> Database[("輕量資料庫<br/>electron-store<br/>UserStatus Interface")]
    Database --> QueryResult[回傳查詢結果]
    QueryResult --> AIResponse[AI 回覆使用者]

    %% 狀態更新處理
    StatusUpdate --> MCPTools[MCP Tools 調用]
    MCPTools --> ConflictCheck{檢查時段衝突}
    ConflictCheck --> |有衝突| OverwriteConfirm[後進先出原則<br/>覆蓋並詢問歷史保留]
    ConflictCheck --> |無衝突| DirectUpdate[直接更新狀態]

    OverwriteConfirm --> UpdateDatabase[更新主狀態表<br/>建立高優先級 TimeSlot]
    DirectUpdate --> UpdateDatabase
    UpdateDatabase --> Database
    UpdateDatabase --> SuccessResponse[AI 確認更新成功]

    %% AI 回覆回到聊天頁面
    AIResponse --> ChatPage
    SuccessResponse --> ChatPage

    %% /dashboard 頁面功能
    DashboardPage --> StatusDisplay[同仁狀態顯示<br/>優先級排序]
    DashboardPage --> ManualSyncBtn[手動同步按鈕]

    %% 手動同步功能 (僅在 dashboard 頁面)
    ManualSyncBtn --> |觸發同步| SyncProcess[同步當日資料<br/>AttendanceRecord + CalendarEvent]
    SyncProcess --> UpdateDisplay[更新狀態顯示]
    UpdateDisplay --> DashboardPage

    %% 使用者互動示例
    ChatPage --> |例如查詢| ExampleQuery["小王和小李現在在做什麼？"]
    ChatPage --> |例如更新| ExampleUpdate["我有任務要外出，下午3點回來"]

    ExampleQuery --> AIChat
    ExampleUpdate --> AIChat

    %% 資料流向 (兩個頁面都會讀取狀態)
    Database -.-> StatusDisplay
    Database -.-> AIResponse
    StatusDisplay --> |顯示優先級| PriorityDisplay[AI修改 > 出勤 > 行事曆]

    %% 頁面之間的資料同步
    UpdateDatabase -.-> |即時更新| StatusDisplay
    SyncProcess -.-> |資料更新| Database