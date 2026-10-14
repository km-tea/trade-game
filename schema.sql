-- Neon SQL Editor에서 한 번 실행하세요.
CREATE TABLE IF NOT EXISTS trade_groups (
  group_no integer PRIMARY KEY CHECK (group_no BETWEEN 1 AND 6),
  coins integer NOT NULL DEFAULT 10 CHECK (coins >= 0),
  resources jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS crafted_items (
  id bigserial PRIMARY KEY,
  group_no integer NOT NULL REFERENCES trade_groups(group_no) ON DELETE CASCADE,
  recipe_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_no, recipe_id)
);
CREATE TABLE IF NOT EXISTS trade_proposals (
  id bigserial PRIMARY KEY,
  from_group integer NOT NULL REFERENCES trade_groups(group_no),
  to_group integer NOT NULL REFERENCES trade_groups(group_no),
  message varchar(200) NOT NULL,
  offer varchar(100) NOT NULL,
  want varchar(100) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE TABLE IF NOT EXISTS trade_history (
  id bigserial PRIMARY KEY,
  group_no integer,
  title varchar(100) NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS game_settings (
  id integer PRIMARY KEY CHECK(id=1),
  timer_seconds integer NOT NULL DEFAULT 60,
  timer_running boolean NOT NULL DEFAULT false
);
INSERT INTO trade_groups(group_no,coins,resources) VALUES
(1,10,'{"wood":4,"cotton":4,"iron":1,"oil":0,"food":1,"gold":0}'),
(2,10,'{"iron":4,"oil":4,"wood":1,"cotton":0,"food":0,"gold":1}'),
(3,10,'{"oil":4,"food":4,"wood":0,"iron":1,"cotton":1,"gold":0}'),
(4,10,'{"cotton":4,"food":4,"wood":1,"iron":0,"oil":0,"gold":1}'),
(5,10,'{"gold":4,"wood":4,"iron":0,"oil":1,"cotton":0,"food":1}'),
(6,10,'{"iron":4,"gold":4,"wood":0,"oil":1,"cotton":1,"food":0}')
ON CONFLICT(group_no) DO NOTHING;
INSERT INTO game_settings(id,timer_seconds,timer_running) VALUES(1,60,false) ON CONFLICT(id) DO NOTHING;
