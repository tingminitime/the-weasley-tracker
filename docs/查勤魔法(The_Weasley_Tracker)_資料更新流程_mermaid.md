---
title: 查勤魔法 The Weasley Tracker ( 資料更新流程 )
---
flowchart TD
    %% 應用程式啟動
    AppStart([應用程式啟動]) --> LoadUsers[載入用戶基本資料]
    LoadUsers --> LoadCurrentStatus[載入當前用戶狀態]
    LoadCurrentStatus --> DateCheck{跨日檢查<br/>比較當前日期與 initializedDate}
    
    %% 跨日檢查邏輯
    DateCheck --> |日期相符| TimeCheck{時間邊界檢查}
    DateCheck --> |日期不符<br/>已跨日| CrossDayReset[重新初始化 Mock Data<br/>清空 statusHistory<br/>更新 initializedDate]
    CrossDayReset --> TimeCheck

    %% 重新整理按鈕
    RefreshBtn[重新整理按鈕] --> DateCheck

    %% 基本狀態判斷
    TimeCheck --> |當前時間 < 08:30| SetOffDutyMorning[設定為 off_duty]
    TimeCheck --> |08:30 ≤ 當前時間 ≤ 17:30| CheckUserStatus{檢查用戶狀態}
    TimeCheck --> |當前時間 > 17:30| SetOffDutyEvening[設定為 off_duty]

    %% 檢查用戶是否有自定義狀態
    CheckUserStatus --> |有AI設定的狀態| KeepUserStatus[保持用戶設定狀態]
    CheckUserStatus --> |無特殊狀態| SetOnDuty[設定為 on_duty]

    %% AI 狀態更新
    UserChat[使用者 AI 對話] --> AIProcessing[AI 理解需求<br/>調用 MCP Tools]
    AIProcessing --> ValidateStatus{驗證狀態有效性}
    
    ValidateStatus --> |有效狀態| DirectUpdate[直接更新當前狀態]
    ValidateStatus --> |無效請求| ErrorResponse[回覆錯誤訊息]

    %% 狀態更新和記錄
    SetOffDutyMorning --> RecordChange[記錄狀態變更<br/>source: system]
    SetOnDuty --> RecordChange
    SetOffDutyEvening --> RecordChange
    KeepUserStatus --> DisplayStatus[顯示當前狀態]
    DirectUpdate --> RecordAIChange[記錄狀態變更<br/>source: ai_modified]

    %% 狀態歷史記錄
    RecordChange --> AddToHistory[新增到 statusHistory]
    RecordAIChange --> AddToHistory

    %% 更新資料庫
    AddToHistory --> UpdateDatabase[更新用戶狀態表<br/>UserStatus]
    ErrorResponse --> UserChat

    %% 顯示更新後狀態
    UpdateDatabase --> DisplayStatus[顯示當前狀態]
    DisplayStatus --> Database[("輕量資料庫<br/>electron-store")]

    %% 狀態查詢流程
    StatusQuery[狀態查詢請求] --> QueryDatabase[從資料庫查詢]
    QueryDatabase --> ReturnStatus[回傳當前狀態]
    ReturnStatus --> DisplayStatus

    %% 資料庫連接到顯示
    Database --> |即時顯示| CurrentStatusDisplay[前端狀態顯示]
