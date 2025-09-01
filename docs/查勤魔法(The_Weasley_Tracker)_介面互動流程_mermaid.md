---
title: 查勤魔法 The Weasley Tracker ( 介面互動流程 )
---
flowchart TD
    %% 應用程式啟動與路由
    Start([應用程式啟動]) --> RouteCheck{檢查登入狀態}
    RouteCheck --> |未登入| LoginPage["/login 登入頁面"]
    RouteCheck --> |已登入| HomePage["首頁<br/>自動導向 /chat"]
    
    %% 登入頁面
    LoginPage --> |使用者登入<br/>Mock Data| InitializeApp[初始化應用程式<br/>載入基本資料和狀態<br/>執行跨日檢查]
    InitializeApp --> HomePage
    
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
    QueryType --> |其他對話| GeneralChat[一般對話回應]

    %% 狀態查詢處理
    StatusQuery --> QueryDatabase[查詢資料庫]
    QueryDatabase --> Database[("輕量資料庫<br/>electron-store<br/>UserStatus Interface")]
    Database --> QueryResult[回傳查詢結果]
    QueryResult --> AIResponse[AI 回覆使用者]

    %% 狀態更新處理
    StatusUpdate --> ValidateStatusUpdate{驗證狀態更新}
    ValidateStatusUpdate --> |有效更新| DirectUpdate[直接更新當前狀態]
    ValidateStatusUpdate --> |無效請求| InvalidResponse[回覆無效請求訊息]

    DirectUpdate --> UpdateDatabase[更新用戶狀態<br/>記錄到 statusHistory]
    UpdateDatabase --> Database
    UpdateDatabase --> SuccessResponse[AI 確認更新成功]

    %% 一般對話處理
    GeneralChat --> AIResponse

    %% AI 回覆回到聊天頁面
    AIResponse --> ChatPage
    SuccessResponse --> ChatPage
    InvalidResponse --> ChatPage

    %% /dashboard 頁面功能
    DashboardPage --> StatusDisplay[同仁狀態顯示]
    DashboardPage --> RefreshBtn[重新整理按鈕]

    %% 重新整理功能
    RefreshBtn --> |觸發重新整理| RefreshProcess[執行跨日檢查<br/>執行時間邊界檢查<br/>重置為基本狀態]
    RefreshProcess --> UpdateDisplay[更新狀態顯示]
    UpdateDisplay --> DashboardPage

    %% 使用者互動示例
    ChatPage --> |例如查詢| ExampleQuery["小王和小李現在在做什麼？"]
    ChatPage --> |例如更新| ExampleUpdate["我要外出，下午3點回來"]

    ExampleQuery --> AIChat
    ExampleUpdate --> AIChat

    %% 資料流向 (兩個頁面都會讀取狀態)
    Database -.-> StatusDisplay
    Database -.-> AIResponse
    StatusDisplay --> |顯示當前狀態| CurrentStatusDisplay[顯示即時狀態]

    %% 頁面之間的資料同步
    UpdateDatabase -.-> |即時更新| StatusDisplay
    RefreshProcess -.-> |狀態重置| Database