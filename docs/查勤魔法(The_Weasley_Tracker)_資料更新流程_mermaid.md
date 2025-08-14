---
title: 查勤魔法 The Weasley Tracker ( 資料更新流程 )
---
flowchart TD
    %% 應用程式啟動同步
    AppStart([應用程式啟動]) --> AutoSync[自動同步當日資料]
    AutoSync --> SyncAttendance[同步出勤紀錄表<br/>AttendanceRecord]
    AutoSync --> SyncCalendar[同步行事曆紀錄表<br/>CalendarEvent]

    %% 手動同步
    ManualSync[手動同步] --> SyncAttendance
    ManualSync --> SyncCalendar

    %% 資料來源處理
    SyncAttendance --> |當日資料<br/>on_duty/off_duty/on_leave/wfh| CreateTimeSlots[建立 TimeSlot]
    SyncCalendar --> |當日資料<br/>meeting| CreateTimeSlots

    %% AI 即時更新
    UserChat[使用者 AI 對話] --> AIProcessing[AI 理解需求<br/>調用 MCP Tools]
    AIProcessing --> |後進先出原則| ConflictCheck{時段衝突檢查}

    %% 衝突處理
    ConflictCheck --> |有衝突| OverwriteSchedule[覆蓋衝突時段<br/>詢問是否保留歷史]
    ConflictCheck --> |無衝突| DirectUpdate[直接建立新狀態]

    %% TimeSlot 建立與優先級設定
    CreateTimeSlots --> SetPriority{設定優先級}
    OverwriteSchedule --> SetPriority
    DirectUpdate --> SetPriority

    SetPriority --> |ai_modified| AIPriority[優先級 3<br/>最高優先級]
    SetPriority --> |attendance| AttendancePriority[優先級 2<br/>中等優先級]
    SetPriority --> |calendar| CalendarPriority[優先級 1<br/>最低優先級]

    %% 狀態過期時間設定
    AIPriority --> ExpiryTimeSet{設定過期時間}
    AttendancePriority --> ExpiryTimeSet
    CalendarPriority --> ExpiryTimeSet

    ExpiryTimeSet --> |工作狀態<br/>on_duty/wfh/out| WorkExpiry[17:30 下班時間過期]
    ExpiryTimeSet --> |會議狀態<br/>meeting| MeetingExpiry[會議結束時間過期]
    ExpiryTimeSet --> |請假狀態<br/>on_leave| LeaveExpiry[請假結束時間過期]
    ExpiryTimeSet --> |下班狀態<br/>off_duty| OffExpiry[隔日 08:30 上班時間過期]

    %% 更新主狀態表
    WorkExpiry --> UpdateMainStatus[更新主狀態表<br/>UserStatus]
    MeetingExpiry --> UpdateMainStatus
    LeaveExpiry --> UpdateMainStatus
    OffExpiry --> UpdateMainStatus

    %% 狀態過期檢查（啟動時或同步時觸發）
    UpdateMainStatus --> ExpiryCheck{檢查狀態過期}
    ExpiryCheck --> |已過期| TimeCheck{時間邊界檢查}
    ExpiryCheck --> |未過期| DisplayStatus[顯示當前狀態]

    %% 過期狀態恢復 - 修改後的詳細邏輯
    TimeCheck --> |非工作日或非工作時間| SetOffDuty[設定為 off_duty]
    TimeCheck --> |工作時間內<br/>08:30-17:30| HighPriorityCheck{檢查高優先級<br/>未過期狀態}

    %% 高優先級狀態檢查
    HighPriorityCheck --> |存在未過期高優先級狀態| UseHighPriority[使用高優先級狀態]
    HighPriorityCheck --> |不存在| ActivityCheck{檢查當前活動}

    %% 當前活動檢查
    ActivityCheck --> |有請假、會議、外出狀態<br/>on_leave/meeting/out| UseActivity[使用活動狀態]
    ActivityCheck --> |無當前活動| AttendanceCheck{檢查出勤記錄}

    %% 出勤記錄檢查 - 修改後的邏輯
    AttendanceCheck --> |有 checkOut| SetOffDutyFromAttendance[設定為 off_duty]
    AttendanceCheck --> |有 checkIn 無 checkOut| WorkTypeCheck{檢查 workType}
    AttendanceCheck --> |無 checkIn| SetOffDutyFromAttendance

    %% 工作類型檢查
    WorkTypeCheck --> |office| SetOnDuty[設定為 on_duty]
    WorkTypeCheck --> |wfh| SetWFH[設定為 wfh]

    %% 預設狀態
    AttendanceCheck --> |無出勤記錄| DefaultStatus[工作時間內預設 on_duty<br/>其他時間預設 off_duty]

    %% 所有狀態更新都匯入資料庫
    SetOffDuty --> Database[("輕量資料庫<br/>electron-store")]
    UseHighPriority --> Database
    UseActivity --> Database
    SetOffDutyFromAttendance --> Database
    SetOnDuty --> Database
    SetWFH --> Database
    DefaultStatus --> Database
    DisplayStatus --> Database

    %% 資料庫連接
    Database --> |優先級排序顯示| CurrentStatus[當前狀態顯示<br/>高優先級優先]
