# GABI-Media-Manager
> GABI 的 ProContent 影片管理工具，用於簡化投影員選擇背景影片的流程。

[![License](https://img.shields.io/badge/License-GNU_3.0-blue.svg)](https://opensource.org/license/gpl-3-0)
![Make With Love](https://img.shields.io/badge/make_with_%E2%9D%A4%EF%B8%8F-white)

[![wakatime](https://wakatime.com/badge/user/ca727ba5-9112-4612-b454-d5e407277a51/project/e28f1bcd-fef9-4905-b8d0-761aee8acb80.svg)](https://wakatime.com/badge/user/ca727ba5-9112-4612-b454-d5e407277a51/project/e28f1bcd-fef9-4905-b8d0-761aee8acb80)

## 資料庫結構

### video_data (影片資料表)
| 欄位名稱         | 資料型態 | 說明                              |
| ---------------- | -------- | --------------------------------- |
| video_id         | INTEGER  | 主鍵，自動遞增                    |
| group_id         | INTEGER  | 影片所屬群組ID                    |
| video_filename   | TEXT     | 影片檔案名稱                      |
| video_resolution | TEXT     | 影片解析度                        |
| video_format     | TEXT     | 影片格式 (E.g. MP4, WAV)          |
| video_duration   | FLOAT  | 影片長度（秒）                    |
| video_filesize   | INTEGER  | 影片檔案大小（位元組）            |
| video_frame_rate | FLOAT  | 影片幀率 (E.g. 59.97fps, 60fps)   |
| video_codec      | TEXT     | 影片編碼格式 (E.g. H.264, ProRes) |

### video_group_data (影片群組資料表)
| 欄位名稱         | 資料型態 | 說明                           |
| ---------------- | -------- | ------------------------------ |
| group_id         | INTEGER  | 主鍵，自動遞增                 |
| group_title      | TEXT     | 影片群組標題                   |
| group_desc       | TEXT     | 影片群組描述                   |
| group_author     | TEXT     | 影片群組作者 (E.g. ProContent) |
| group_tags       | TEXT     | 影片群組標籤 (E.g. 100, 131)   |
| group_thumb_name | TEXT     | 影片群組縮圖檔案名稱           |
| group_add_at     | DATE | 影片群組創建時間               |

### tag_data (標籤資料表)
| 欄位名稱        | 資料型態 | 說明           |
| --------------- | -------- | -------------- |
| tag_id          | INTEGER  | 主鍵，自動遞增 |
| tag_name        | TEXT     | 標籤名稱       |
| tag_locale_name | TEXT     | 標籤本地化名稱 |

### user_data (使用者資料表)
| 欄位名稱      | 資料型態 | 說明                     |
| ------------- | -------- | ------------------------ |
| user_id       | INTEGER  | 主鍵，自動遞增           |
| username      | TEXT     | 使用者帳戶名稱           |
| locale_name   | TEXT     | 使用者顯示名稱           |
| password_hash | TEXT     | 使用者密碼雜湊值         |
| role          | TEXT     | 使用者角色 (ADMIN, USER) |
| last_login_at | DATE | 最後登入時間             |

### action_record (操作紀錄表)
| 欄位名稱    | 資料型態 | 說明                  |
| ----------- | -------- | --------------------- |
| id         | INTEGER  | 主鍵，自動遞增        |
| user_id     | INTEGER  | 執行操作的使用者ID    |
| action_type | TEXT     | 操作類型 (E.g. LOGIN) |
| action_info | TEXT     | 操作描述              |
| ip_addr     | TEXT     | 使用者IP地址          |
| datetime    | DATE | 操作時間              |