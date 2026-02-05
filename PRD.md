# Project Name: 2025 Enterprise Employment Time-Machine (全市用工时序监测大脑)

## 1. 项目愿景 (Vision)
构建一个基于时间轴的企业用工数据仓库。
利用 2025 年全年的历史数据建立基准，通过“存量回溯 + 增量填报”模式，为政府领导提供**可回溯、可预测**的用工决策支持系统。

## 2. 核心用户 (User Personas)
* **政府决策者**: 需要看到“趋势”。例如：春节后（2-3月）是否出现了用工荒？现在的缺工情况比年初好转了吗？
* **企业联络员**: 极简填报当月数据。

## 3. 数据库设计 (Schema Design)
*支持多月份数据的归一化存储*

### 3.1 Table: `companies` (企业档案)
* `id`: UUID (Primary Key)
* `name`: Text (Unique Index, 企业全称)
* `town`: Text (乡镇)
* `industry`: Text (行业)
* `contact_person`: Text
* `contact_phone`: Text
* `access_code`: Text (登录码)
* `created_at`: Timestamp

### 3.2 Table: `monthly_reports` (月度报表 - 核心表)
* `id`: UUID (Primary Key)
* `company_id`: UUID (FK -> companies.id)
* `report_month`: Date (关键字段: '2025-01-01', '2025-02-01'...)
* `employees_total`: Int (现有员工数)
* `recruited_new`: Int (本月新招)
* `resigned_total`: Int (本月流失)
* `net_growth`: Int (计算字段: 新招 - 流失)
* `shortage_total`: Int (急缺总数)
* `shortage_detail`: JSONB (普工/技工/管理缺口)
* `notes`: Text (备注)
* *Constraint*: Unique index on `(company_id, report_month)`

## 4. 开发与执行规划 (Execution Plan)

### 🔴 步骤一：批量数据清洗 (Batch Data Pipeline)
* **目标**: 将 10 个 CSV 文件一次性导入数据库。
* **逻辑**: 编写脚本 `scripts/seed_history.ts`。
    1.  遍历 `data/` 目录下的所有 `.csv` 文件。
    2.  **正则提取月份**: 从文件名 `...（X月）...` 中提取数字 X，构造日期 `2025-0X-01`。
    3.  **解析表头**: 识别统一的列索引（经分析，虽然表头文字微调，但列位置基本固定）。
        - 员工数: Col 6
        - 本月新招: Col 10
        - 本月流失: Col 13
        - 急缺总数: Col 15
    4.  **Upsert**: 保证重复运行脚本不会导致数据重复。

### 🟡 步骤二：时序大屏 (Time-Series Dashboard)
* **功能 2.1: 全市用工走势图 (Line Chart)**
    - X轴: 1月 -> 10月。
    - Y轴: 全市总用工人数 / 总缺工人数。
    - *价值*: 一眼看清全年用工波峰波谷。
* **功能 2.2: 乡镇/行业 趋势对比**
    - 允许筛选“岳口镇”，查看该镇 1-10 月的缺工变化曲线。
* **功能 2.3: 异常监测 (Anomaly Detection)**
    - 找出“连续 3 个月流失人数 > 新招人数”的企业，列入**预警名单**。

### 🟢 步骤三：AI 智能分析 (Trend Analyst)
* **Prompt 升级**:
    - 旧: "分析这个月的数据。"
    - **新**: "根据 1-10 月的数据，分析全市用工的季节性特征。哪个月是招聘旺季？目前的缺口与年初相比是扩大还是缩小了？"

### 🔵 步骤四：智能报表 (Smart Report)
* **目标**: 生成类似 `report.tmzpw.net` 的打印级报表。
* **特性**:
    - **A4 打印优化**: 针对打印布局设计的 CSS (`@media print`)。
    - **配色复刻**: 还原参考网站的色系（需截图确认）。
    - **内容**: 包含核心指标卡片、趋势图截图、异常企业列表。

## 5. 技术栈
* Antigravity (IDE) + Next.js 14 + Supabase + Recharts (强项在于画趋势图) + Vercel AI SDK.
