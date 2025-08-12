---
title: 查勤魔法 The Weasley Tracker ( 介面互動流程 )
---
flowchart TD
    %% 使用者登入系統
    Start([應用程式啟動]) --> Login[使用者登入/登出<br/>Mock Data]
    Login --> InitSync[初始化同步<br/>當日出勤 + 行事曆紀錄]
    InitSync --> MainInterface[主要介面]
    
    %% 主要介面功能區塊
    MainInterface --> StatusDisplay[同仁狀態顯示<br/>優先級排序]
    MainInterface --> AIChat[AI 對話介面]
    MainInterface --> ManualSyncBtn[手動同步按鈕]
    
    %% 手動同步功能
    ManualSyncBtn --> |觸發同步| SyncProcess[同步當日資料<br/>AttendanceRecord + CalendarEvent]
    SyncProcess --> UpdateDisplay[更新狀態顯示]
    UpdateDisplay --> MainInterface
    
    %% AI 對話功能
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
    
    %% AI 回覆
    AIResponse --> MainInterface
    SuccessResponse --> MainInterface
    
    %% 使用者互動示例
    MainInterface --> |例如查詢| ExampleQuery["小王和小李現在在做什麼？"]
    MainInterface --> |例如更新| ExampleUpdate["我有任務要外出，下午3點回來"]
    
    ExampleQuery --> AIChat
    ExampleUpdate --> AIChat
    
    %% 資料流向
    Database -.-> StatusDisplay
    StatusDisplay --> |顯示優先級| PriorityDisplay[AI修改 > 出勤 > 行事曆]