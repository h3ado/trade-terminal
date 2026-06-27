-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "instrument_type" TEXT,
    "quantity" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "entry_price" DECIMAL(18,8),
    "exit_price" DECIMAL(18,8),
    "entry_date" TIMESTAMP(3),
    "exit_date" TIMESTAMP(3),
    "stop_loss" DECIMAL(18,8),
    "take_profit" DECIMAL(18,8),
    "fees" DECIMAL(18,8) DEFAULT 0,
    "pnl" DECIMAL(18,8),
    "status" TEXT,
    "strategy" TEXT,
    "setup" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "mistakes" TEXT[],
    "rating" INTEGER,
    "screenshots" TEXT[],
    "extra" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_companies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "sector" TEXT,
    "lat" DECIMAL(10,6) NOT NULL,
    "lng" DECIMAL(10,6) NOT NULL,
    "market_cap" DECIMAL(20,2),
    "hq" TEXT,
    "notes" TEXT,
    "override_id" TEXT,
    "is_deletion" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_saved_searches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "alert_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_brief_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_brief_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_news_links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trade_id" UUID NOT NULL,
    "cluster_key" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT,
    "tone" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_news_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_x_cache" (
    "id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_x_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_geo_events" (
    "id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "event_type" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "source" TEXT,
    "country" TEXT,
    "fatalities" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_geo_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_daily_wrap" (
    "wrap_date" DATE NOT NULL,
    "summary" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_daily_wrap_pkey" PRIMARY KEY ("wrap_date")
);

-- CreateTable
CREATE TABLE "news_thesis_cache" (
    "scope_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_thesis_cache_pkey" PRIMARY KEY ("scope_key")
);

-- CreateTable
CREATE TABLE "news_contradiction_clusters" (
    "id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "headline_urls" TEXT[],
    "stance_variance" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_contradiction_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_earnings_cache" (
    "id" UUID NOT NULL,
    "ticker" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "source" TEXT,
    "url" TEXT,
    "transcript_summary" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_earnings_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_qa_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "headline_url" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_qa_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_audio_queue" (
    "id" UUID NOT NULL,
    "headline_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "domain" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "played" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "news_audio_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_cb_doc_cache" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "doc_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_cb_doc_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "econ_calendar_events" (
    "id" UUID NOT NULL,
    "source" TEXT,
    "kind" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "country" TEXT,
    "ticker" TEXT,
    "label" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "prior" DECIMAL(18,6),
    "forecast" DECIMAL(18,6),
    "actual" DECIMAL(18,6),
    "unit" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "econ_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cot_snapshots" (
    "id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CFTC public reporting',
    "market_rows" INTEGER NOT NULL DEFAULT 0,
    "legacy_rows" INTEGER NOT NULL DEFAULT 0,
    "disagg_rows" INTEGER NOT NULL DEFAULT 0,
    "tff_rows" INTEGER NOT NULL DEFAULT 0,
    "cit_rows" INTEGER NOT NULL DEFAULT 0,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cot_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cot_market_history" (
    "id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "asset" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "open_interest" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "commercials" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "managed_money" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "non_reportable" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "week_change" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "four_week_change" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "pct_rank" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "bias" TEXT NOT NULL DEFAULT 'Neutral',
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cot_market_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cot_report_history" (
    "id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "report_type" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "ticker" TEXT,
    "row_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cot_report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_strategy_templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legs" JSONB NOT NULL,
    "stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_strategy_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_alert_rules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "rule_type" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_cache" (
    "week_start" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_cache_pkey" PRIMARY KEY ("week_start")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_quotes" (
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "exchange" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "price" DOUBLE PRECISION,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "prev_close" DOUBLE PRECISION,
    "change" DOUBLE PRECISION,
    "change_pct" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "avg_volume" DOUBLE PRECISION,
    "week_high_52" DOUBLE PRECISION,
    "week_low_52" DOUBLE PRECISION,
    "is_market_open" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_quotes_pkey" PRIMARY KEY ("ticker")
);

-- CreateTable
CREATE TABLE "market_candles" (
    "ticker" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "close" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_candles_pkey" PRIMARY KEY ("ticker","interval","date")
);

-- CreateTable
CREATE TABLE "market_fundamentals" (
    "ticker" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_fundamentals_pkey" PRIMARY KEY ("ticker")
);

-- CreateTable
CREATE TABLE "market_peers" (
    "ticker" TEXT NOT NULL,
    "peers" JSONB NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_peers_pkey" PRIMARY KEY ("ticker")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trading_accounts_user_id_idx" ON "trading_accounts"("user_id");

-- CreateIndex
CREATE INDEX "trades_user_id_idx" ON "trades"("user_id");

-- CreateIndex
CREATE INDEX "trades_account_id_idx" ON "trades"("account_id");

-- CreateIndex
CREATE INDEX "custom_companies_user_id_idx" ON "custom_companies"("user_id");

-- CreateIndex
CREATE INDEX "custom_companies_override_id_idx" ON "custom_companies"("override_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key_key" ON "user_preferences"("user_id", "key");

-- CreateIndex
CREATE INDEX "news_brief_log_user_id_idx" ON "news_brief_log"("user_id");

-- CreateIndex
CREATE INDEX "trade_news_links_trade_id_idx" ON "trade_news_links"("trade_id");

-- CreateIndex
CREATE INDEX "trade_news_links_user_id_idx" ON "trade_news_links"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_x_cache_cache_key_key" ON "news_x_cache"("cache_key");

-- CreateIndex
CREATE INDEX "news_x_cache_fetched_at_idx" ON "news_x_cache"("fetched_at" DESC);

-- CreateIndex
CREATE INDEX "news_geo_events_occurred_at_idx" ON "news_geo_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "news_geo_events_country_idx" ON "news_geo_events"("country");

-- CreateIndex
CREATE INDEX "news_contradiction_clusters_created_at_idx" ON "news_contradiction_clusters"("created_at" DESC);

-- CreateIndex
CREATE INDEX "news_earnings_cache_ticker_fetched_at_idx" ON "news_earnings_cache"("ticker", "fetched_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "news_earnings_cache_ticker_period_key" ON "news_earnings_cache"("ticker", "period");

-- CreateIndex
CREATE INDEX "news_qa_log_user_id_created_at_idx" ON "news_qa_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "news_audio_queue_created_at_idx" ON "news_audio_queue"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "news_cb_doc_cache_doc_url_key" ON "news_cb_doc_cache"("doc_url");

-- CreateIndex
CREATE INDEX "news_cb_doc_cache_published_at_idx" ON "news_cb_doc_cache"("published_at" DESC);

-- CreateIndex
CREATE INDEX "econ_calendar_events_ts_importance_idx" ON "econ_calendar_events"("ts", "importance" DESC);

-- CreateIndex
CREATE INDEX "econ_calendar_events_kind_idx" ON "econ_calendar_events"("kind");

-- CreateIndex
CREATE INDEX "econ_calendar_events_ticker_idx" ON "econ_calendar_events"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "cot_snapshots_report_date_key" ON "cot_snapshots"("report_date");

-- CreateIndex
CREATE INDEX "cot_market_history_ticker_report_date_idx" ON "cot_market_history"("ticker", "report_date" DESC);

-- CreateIndex
CREATE INDEX "cot_market_history_report_date_asset_idx" ON "cot_market_history"("report_date" DESC, "asset");

-- CreateIndex
CREATE UNIQUE INDEX "cot_market_history_report_date_ticker_key" ON "cot_market_history"("report_date", "ticker");

-- CreateIndex
CREATE INDEX "cot_report_history_report_type_report_date_idx" ON "cot_report_history"("report_type", "report_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "cot_report_history_report_date_report_type_market_ticker_key" ON "cot_report_history"("report_date", "report_type", "market", "ticker");

-- CreateIndex
CREATE INDEX "option_strategy_templates_user_id_created_at_idx" ON "option_strategy_templates"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_user_id_week_start_key" ON "quiz_attempts"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "market_candles_ticker_interval_date_idx" ON "market_candles"("ticker", "interval", "date" DESC);

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_companies" ADD CONSTRAINT "custom_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_saved_searches" ADD CONSTRAINT "news_saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_brief_log" ADD CONSTRAINT "news_brief_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_news_links" ADD CONSTRAINT "trade_news_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_news_links" ADD CONSTRAINT "trade_news_links_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_qa_log" ADD CONSTRAINT "news_qa_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_strategy_templates" ADD CONSTRAINT "option_strategy_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_alert_rules" ADD CONSTRAINT "option_alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

